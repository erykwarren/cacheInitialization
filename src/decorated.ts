// type FetchingFunction = () => Promise<any>;

/**
 * The Cache class
 */
class CentralCache {
  private store: { [key: string]: any } = {};
  private activeFetches: { [key: string]: Promise<any> } = {};

  /**
   * Compute a cache key from the given args
   */
  public static buildCacheKey(keyPrefix: string, args: string[]): string {
    return [keyPrefix, ...args].join('-');
  }

  /**
   * Fetching function wrapper
   */
  public async getValue(key: string, fetchFn: FetchingFunction, context, ...args): Promise<any> {
    // already cached?
    const cached = this.store[key];
    if (cached) {
      return cached;
    }

    // already fetching?
    const currentFetch = this.activeFetches[key];
    if (currentFetch) {
      return await currentFetch;
    }

    // I'm the one fetching
    const fetch = this.activeFetches[key] = fetchFn.apply(context, args);
    const result = this.store[key] = await fetch;
    delete this.activeFetches[key];
    return result;
  }
}

/**
 * The global Cache object
 */
const globalCache = new CentralCache();

/**
 * The decorator
 */
function cached(keyType: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const origFn = descriptor.value;
    // don't use an => function here, or you lose access to 'this'
    const newFn = function (...args) {
      const key = CentralCache.buildCacheKey(keyType, args);
      return globalCache.getValue(key, origFn, this, ...args);
    };
    descriptor.value = newFn;
    return descriptor;
  };
}

/**
 * Testing code
 */
interface Response {
  variant: string;
  value: number;
}

class MyClass {
  domain: string;
  numCalled: number;

  constructor(domain: string) {
    this.domain = domain;
    this.numCalled = 0;
  }

  async fetchSomething(variant: string): Promise<Response> {
    this.numCalled++;
    await new Promise(resolve => setTimeout(resolve,100));
    return {
      variant: variant,
      value: 100 + parseInt(variant)
    };
  }

  @cached('myType')
  getSomething(variant: string): Promise<number> {
    return this.fetchSomething(variant);
  }
}



async function runTest() {
  const myObj = new MyClass('mydomain');
  const jobs = [];

  for(let i = 0; i < 100; i++) {
    const variant = i % 10;
    jobs.push(myObj.getSomething(variant.toString()));
  }

  const results = await Promise.all(jobs);
  let success = 0;
  results.forEach(x => {
    if (x.value === 100 + parseInt(x.variant)) {
      success++;
    }
  });

  console.log('Number time fetched:', myObj.numCalled);
  console.log('Number successes:', success);
}

runTest();
