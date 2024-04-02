import { createContext } from 'react';

import { RouteController } from './RouteController.js';
import { normalize } from './normalize.js';
import { BACK, DEFAULT_PATH, NAVIGATION, NavigationOptions, RouteChangeCB } from './types.js';

export const RouterContext = createContext<RouterController<any>>(
  null as unknown as RouterController<any>,
);

export class RouterController<T> {
  /**
   * Stack to keep track of the paths that we have been
   * browsing
   */
  private stack: Array<string> = [];
  private onRouteChange: RouteChangeCB = () => {};
  public readonly root: RouteController<T>;

  constructor(root: RouteController<T>, onRouteChange?: RouteChangeCB) {
    this.root = root;
    if (onRouteChange) {
      this.onRouteChange = onRouteChange;
    }
  }

  updateDefaultPath(defaultPath: string, basePath: string) {
    const lastItem = this.stack[this.stack.length - 1];
    if (lastItem === undefined) {
      this.stack.push(basePath + defaultPath);
      this.onRouteChange(basePath + defaultPath, DEFAULT_PATH);
    } else if ((basePath + defaultPath).includes(lastItem)) {
      this.stack[this.stack.length - 1] = basePath + defaultPath;
      this.onRouteChange(basePath + defaultPath, DEFAULT_PATH);
    }
  }

  navigateBack(count: number, route?: RouteController<T>) {
    while (count > 0) {
      this.stack.pop();
      count -= 1;
    }
    const lastItem = this.stack[this.stack.length - 1];
    const fullPath = lastItem;

    let routeToUse: RouteController<T> | undefined = route;
    // search for route until it's parent route is found
    while (routeToUse && !fullPath.includes(routeToUse.basePath.slice(0, -1))) {
      routeToUse = routeToUse.parentRoute;
    }
    // if parent route is not found then use root route
    routeToUse = routeToUse || this.root;

    const path = fullPath.substring(routeToUse.basePath.length);
    routeToUse.setUrl(path);
    this.onRouteChange(fullPath, BACK);
  }

  navigate(route: RouteController<T>, path: string, options?: NavigationOptions) {
    const fullPath = normalize(route.basePath, path);
    const lastItem = this.stack[this.stack.length - 1];
    const currentPath = lastItem || '';

    if (currentPath === fullPath) return;

    // We use the given route if possible otherwiser resort to the root router
    let routeToUse: RouteController<T> | undefined = route;

    // search for route until it's parent route is found
    let relativePath = fullPath.substring(routeToUse.basePath.length);
    while (routeToUse) {
      if (
        routeToUse.childPaths.filter(p => routeEqual(relativePath, p)).length > 0 &&
        fullPath.substring(routeToUse.basePath.length).length !== 0 &&
        fullPath.includes(routeToUse.basePath.slice(0, -1))
      ) {
        break;
      }
      routeToUse = routeToUse.parentRoute;
      if (routeToUse) {
        relativePath = fullPath.substring(routeToUse.basePath.length);
      }
    }

    // if parent route is not found then use root route
    routeToUse = routeToUse || this.root;

    // based on the options see if we need to replace the existing page
    // on the stack
    if ((options?.replace || options?.replace === 'always') && routeToUse === route) {
      this.stack.pop();
    }

    // shallow routing is used when we don't want to set any route but only
    // change the current URL; Mostly done after route is changed to sync the route
    // with the UI
    if (options?.shallow) {
      const idx = this.stack.indexOf(fullPath);
      if (idx === -1) {
        this.stack.push(fullPath);
      }
      const path = fullPath.substring(routeToUse.basePath.length);
      routeToUse.setShallowUrl(path);
    } else {
      this.stack.push(fullPath);
      // Limit the stack size to 100
      if (this.stack.length > 100) this.stack.length = 100;
      // See if we are able to use the given route
      const path = fullPath.substring(routeToUse.basePath.length);
      routeToUse.setUrl(path);
    }
    this.onRouteChange(fullPath, NAVIGATION);
  }
}

function cleanPath(path: string) {
  if (!path) {
    return '';
  }
  return path.split('?')[0].split('#')[0];
}

// Checks if route are the same based on remaining routes
// For Ex:: ab/cd and ab are same route but ab/cd and ab/ef are
// different routes
// and ab/cd?q=20 and ab are same routes

function routeEqual(r1: string, r2: string) {
  const v1 = cleanPath(r1)
    .split('/')
    .filter(v => !!v);
  const v2 = cleanPath(r2)
    .split('/')
    .filter(v => !!v);

  const loopUntil = Math.min(v1.length, v2.length);
  for (let i = 0; i < loopUntil; i++) {
    if (v1[i] !== v2[i]) {
      return false;
    }
  }
  return true;
}
