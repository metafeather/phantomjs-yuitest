// Dependencies and src to test
Y.phantomjs.scripts = [
    "library-to-test.js"
];

Y.phantomjs.tests.testCase1 = new Y.Test.Case({


  name: "Example test",

  "test library present" : function(){

    Y.Assert.isObject(L);

  },

  "test library version" : function(){

    Y.Assert.areEqual(0.1, L.version);

  },

  "test library can add" : function(){

    var i = L.add(23);
    Y.Assert.areEqual(23, i);
    Y.Assert.areEqual(23, L.count);

    var i = L.add(-13);
    Y.Assert.areEqual(10, i);
    Y.Assert.areEqual(10, L.count);

  }

})