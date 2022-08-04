import {cached} from '@timp4w/react-native-async-cached';

export class Cached {
  @cached('my-key', 30)
  async cachedResult() {
    return new Promise((resolve, reject) => {
      return resolve(new Date());
    });
  }
}
