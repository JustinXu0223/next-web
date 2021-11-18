import { action, observable, makeObservable, computed } from 'mobx';

export interface ResultType {
  count: number;
}

class Store {
  constructor() {
    makeObservable(this);
  }

  @observable
  public resultData = <ResultType>{
    count: 0,
  };

  @action
  public setCount = (count: number) => {
    this.resultData.count = count;
  };

  @computed
  public get count() {
    return this.resultData?.count;
  }

  @action
  public clear = () => {
    this.resultData = <ResultType>{};
  };
}

// store
export default new Store();
