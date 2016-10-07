type FetchingFunction = () => Promise<any>;

class Cache {
  private store: { [key: string]: any } = {};
  private activeFetches: { [key: string]: Promise<any> } = {};

  public async getValue(key: string, fetchFn: FetchingFunction): Promise<any> {
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
    const fetch = this.activeFetches[key] = fetchFn();
    const result = this.store[key] = await fetch;
    delete this.activeFetches[key];
    return result;
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
