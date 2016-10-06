
namespace Naive {
  /**
   * a global cache repository. Here it is simplified
   * to a variable.
   */
  let cache: number;

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
   * result we want to cache. In this naive
   * implementation, we simply check if the
   * value is in the cache. If it isn't,
   * we fetch it.
   */
  async function getSomething(): Promise<number> {
    if (cache) {
      return cache;
    }
    cache = await fetchSomething();
    return cache;
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
