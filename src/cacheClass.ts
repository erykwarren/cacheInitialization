
class Cache {
  private store: { [key: string]: number } = {};
  private activeFetches: { [key: string]: Promise<number> } = {};

  public async getValue(key: string, fetchFn): Promise<number> {
    const cached = this.store[key];
    if (cached) {
      return cached;
    }
    const currentFetch = this.activeFetches[key];
    if (!currentFetch) {
      const fetch = this.activeFetches[key] = fetchFn();
      const result = this.store[key] = await fetch;
      delete this.activeFetches[key];
      return result;
    } else {
      return await currentFetch;
    }
  }
}


namespace SimpleCache {
  let numCalled = 0;
  async function fetchSomething(): Promise<number> {
    numCalled++;
    await new Promise(resolve => setTimeout(resolve,100));
    return 105;
  }

  async function runTest() {
    const cache = new Cache();
    const jobs = [];

    for(let i = 0; i < 100; i++) {
      jobs.push(cache.getValue('mykey', fetchSomething));
    }

    const results = await Promise.all(jobs);
    let success = 0;
    results.forEach(x => {
      if (x === 105) {
        success++;
      }
    });

    console.log('Number time fetched:', numCalled);
    console.log('Number successes:', success);
  }

  runTest();

}
