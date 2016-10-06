

namespace Protected {
  /**
   * a global cache repository. Here it is simplified
   * to a variable.
   */
  let cache: number;

  /**
   * We add a variable storing the promise of the current fetch
   */
  let fetchingPromise: Promise<number>;

  /**
   * count the number of time we actually fetch the real value
   */
  let numCalled = 0;

  /**
   * This function simulates an I/O cal
   * that takes 100ms to complete
   */
  async function fetchSomething(): Promise<number> {
    numCalled++;
    await new Promise(resolve => setTimeout(resolve,100));
    return 105;
  }

  /**
   * This is our function whose
   * result we want to cache.
   * In this version, if the cache is not set
   * we fall back on waiting for the fetchingPromise
   * if someone already launched the fetching process.
   */
  async function getSomething(): Promise<number> {
    if (cache) {
      return cache;
    }
    if (!fetchingPromise) {
      fetchingPromise = fetchSomething();
      cache = await fetchingPromise;
      fetchingPromise = undefined;
      return cache;
    } else {
      return await fetchingPromise;
    }
  }

  /**
   * Run a test by launching 100 requests to getSomething()
   */
  async function runTest() {
    const jobs = [];

    for(let i = 0; i < 100; i++) {
      jobs.push(getSomething());
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
