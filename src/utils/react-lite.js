let activeInstance = null;

function isPrimitive(value) {
  return value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function flattenChildren(children) {
  return children.flatMap((child) => {
    if (Array.isArray(child)) return flattenChildren(child);
    if (child === null || child === undefined || typeof child === 'boolean') return [];
    return child;
  });
}

function createElement(type, props, ...children) {
  if (typeof type === 'function') {
    return type({ ...(props || {}), children: flattenChildren(children) });
  }

  if (type === Fragment) {
    const fragment = document.createDocumentFragment();
    flattenChildren(children).forEach((child) => {
      if (isPrimitive(child)) {
        fragment.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        fragment.appendChild(child);
      }
    });
    return fragment;
  }

  const element = document.createElement(type);
  const normalizedProps = props || {};

  for (const [key, value] of Object.entries(normalizedProps)) {
    if (key === 'children') continue;
    if (key === 'className' || key === 'class') {
      element.className = value ?? '';
      continue;
    }
    if (key === 'htmlFor') {
      element.htmlFor = value;
      continue;
    }
    if (key === 'style' && value && typeof value === 'object') {
      for (const [styleName, styleValue] of Object.entries(value)) {
        element.style[styleName] = styleValue;
      }
      continue;
    }
    if (key === 'ref') {
      if (typeof value === 'function') {
        value(element);
      } else if (value && typeof value === 'object') {
        value.current = element;
      }
      continue;
    }
    if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
      continue;
    }
    if (key === 'dangerouslySetInnerHTML' && value && typeof value === 'object' && '__html' in value) {
      element.innerHTML = value.__html;
      continue;
    }
    if (key === 'checked' || key === 'value' || key === 'selected' || key === 'disabled' || key === 'readOnly' || key === 'multiple') {
      if (value !== undefined) {
        element[key] = value;
      }
      continue;
    }
    if (value === false || value === null || value === undefined) continue;
    element.setAttribute(key, String(value));
  }

  flattenChildren(children).forEach((child) => {
    if (isPrimitive(child)) {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });

  return element;
}

function areDepsEqual(prevDeps, nextDeps) {
  if (!prevDeps || !nextDeps || prevDeps.length !== nextDeps.length) return false;
  for (let i = 0; i < prevDeps.length; i += 1) {
    if (prevDeps[i] !== nextDeps[i]) return false;
  }
  return true;
}

function runEffects(instance) {
  if (instance.disposed) return;
  instance.pendingEffects.forEach((hookIndex) => {
    const hook = instance.hooks[hookIndex];
    if (!hook || typeof hook.effect !== 'function') return;
    if (hook.cleanup) {
      try {
        hook.cleanup();
      } catch (error) {
        console.error(error);
      }
    }
    try {
      hook.cleanup = hook.effect() || null;
    } catch (error) {
      hook.cleanup = null;
      console.error(error);
    }
  });
  instance.pendingEffects = [];
}

function queueEffects(instance) {
  Promise.resolve().then(() => runEffects(instance));
}

function cleanupEffects(instance) {
  instance.disposed = true;
  cleanupHookEffects(instance);
}

function cleanupHookEffects(instance) {
  instance.hooks.forEach((hook) => {
    if (hook && typeof hook.cleanup === 'function') {
      try {
        hook.cleanup();
      } catch (error) {
        console.error(error);
      }
      hook.cleanup = null;
    }
  });
  instance.pendingEffects = [];
}

function scheduleRender(instance) {
  if (instance.disposed || instance.scheduled) return;
  instance.scheduled = true;
  Promise.resolve().then(() => {
    if (instance.disposed) return;
    instance.scheduled = false;
    cleanupHookEffects(instance);
    instance.hookIndex = 0;
    instance.forceEffects = true;
    activeInstance = instance;
    const nextRoot = instance.component(instance.props);
    activeInstance = null;
    instance.forceEffects = false;
    const node = wrapFragment(nextRoot);
    if (instance.root && instance.root.parentNode) {
      instance.root.parentNode.replaceChild(node, instance.root);
    }
    instance.root = node;
    queueEffects(instance);
  });
}

function wrapFragment(node) {
  if (node instanceof DocumentFragment) {
    const wrapper = document.createElement('div');
    wrapper.appendChild(node);
    return wrapper;
  }
  return node;
}

export function render(Component, props = {}) {
  const instance = {
    component: Component,
    props,
    hooks: [],
    hookIndex: 0,
    pendingEffects: [],
    scheduled: false,
    disposed: false,
    forceEffects: false,
    root: null,
  };

  const mount = () => {
    instance.hookIndex = 0;
    activeInstance = instance;
    const nextRoot = instance.component(instance.props);
    activeInstance = null;
    instance.root = wrapFragment(nextRoot);
    queueEffects(instance);
    return {
      root: instance.root,
      cleanup: () => {
        cleanupEffects(instance);
        if (instance.root && instance.root.parentNode) {
          instance.root.parentNode.removeChild(instance.root);
        }
      }
    };
  };

  return mount();
}

export function useState(initialValue) {
  if (!activeInstance) {
    throw new Error('useState must be called within a component');
  }
  const instance = activeInstance;
  const hookIndex = activeInstance.hookIndex++;
  if (!activeInstance.hooks[hookIndex]) {
    activeInstance.hooks[hookIndex] = {
      state: typeof initialValue === 'function' ? initialValue() : initialValue,
    };
  }
  const hook = activeInstance.hooks[hookIndex];
  const setState = (value) => {
    const nextState = typeof value === 'function' ? value(hook.state) : value;
    if (nextState === hook.state) return;
    hook.state = nextState;
    scheduleRender(instance);
  };
  return [hook.state, setState];
}

export function useRef(initialValue) {
  if (!activeInstance) {
    throw new Error('useRef must be called within a component');
  }
  const hookIndex = activeInstance.hookIndex++;
  if (!activeInstance.hooks[hookIndex]) {
    activeInstance.hooks[hookIndex] = { current: initialValue };
  }
  return activeInstance.hooks[hookIndex];
}

export function useEffect(effect, deps) {
  if (!activeInstance) {
    throw new Error('useEffect must be called within a component');
  }
  const hookIndex = activeInstance.hookIndex++;
  const prevHook = activeInstance.hooks[hookIndex];
  const hasChanged = activeInstance.forceEffects || !prevHook || !areDepsEqual(prevHook.deps, deps);
  if (hasChanged) {
    activeInstance.hooks[hookIndex] = {
      deps: deps ? [...deps] : undefined,
      effect,
      cleanup: prevHook ? prevHook.cleanup : null,
    };
    activeInstance.pendingEffects.push(hookIndex);
  } else {
    activeInstance.hooks[hookIndex] = prevHook;
  }
}

export function useMemo(factory, deps) {
  if (!activeInstance) {
    throw new Error('useMemo must be called within a component');
  }
  const hookIndex = activeInstance.hookIndex++;
  const prevHook = activeInstance.hooks[hookIndex];
  const hasChanged = !prevHook || !areDepsEqual(prevHook.deps, deps);
  if (hasChanged) {
    const value = factory();
    activeInstance.hooks[hookIndex] = { value, deps: deps ? [...deps] : undefined };
  }
  return activeInstance.hooks[hookIndex].value;
}

export function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}

export { createElement as h };
export const Fragment = Symbol('Fragment');
