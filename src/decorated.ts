
class CentralCache {
  private store: { [key: string]: any } = {};
  private activeFetches: { [key: string]: Promise<any> } = {};

  public async getValue(key: string, fetchFn, context, ...args): Promise<any> {
    const cached = this.store[key];
    if (cached) {
      return cached;
    }
    const currentFetch = this.activeFetches[key];
    if (!currentFetch) {
      try {
        const fetch = this.activeFetches[key] = fetchFn.apply(context, args);
        const result = this.store[key] = await fetch;
        delete this.activeFetches[key];
        return result;
      } catch (err) {
        console.log(err);
      }
    } else {
      return await currentFetch;
    }
  }
}

const globalCache = new CentralCache();

interface CacheClient {
  getCacheKey(keyType: string, ...args): string;
}

interface Response {
  variant: string;
  value: number;
}

function cached(keyType: string) {
  return function (target: CacheClient, propertyKey: string, descriptor: PropertyDescriptor, ...rest) {
    const origFn = descriptor.value;
    let run = 0;
    // don't use an => function here, or you lose access to 'this'
    const newFn = function (...args) {
      const key = this.getCacheKey(keyType, ...args);
      return globalCache.getValue(key, origFn, this, ...args);
    };
    descriptor.value = newFn;
    return descriptor;
  };
}

class MyClass implements CacheClient {
  domain: string;
  numCalled: number;

  constructor(domain: string) {
    this.domain = domain;
    this.numCalled = 0;
  }

  getCacheKey(keyType: string, ...args): string {
    if (keyType === 'myType') {
      return `${this.domain}-${keyType}-${args[0]}`;
    }
    return 'unknown';
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
