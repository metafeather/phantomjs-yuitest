// very simple example library
var L = {

  version: 0.1,

  count: 0,

  add: function(value){
    this.count = this.count + value;
    return this.count;
  }

}