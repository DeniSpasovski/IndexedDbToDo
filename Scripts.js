var myStorage = {};
var indexedDB = window.indexedDB || window.webkitIndexedDB ||
                window.mozIndexedDB;

if ('webkitIndexedDB' in window) {
  window.IDBTransaction = window.webkitIDBTransaction;
  window.IDBKeyRange = window.webkitIDBKeyRange;
}

var currentDateTime = new Date();

myStorage.indexedDB = {};
myStorage.indexedDB.db = null;

myStorage.indexedDB.onerror = function(e) {
  console.log(e);
};

myStorage.indexedDB.open = function() {
  var v = 1;
  var request = indexedDB.open("todos", v);

  request.onupgradeneeded = function (e) {
    myStorage.indexedDB.db = e.target.result;
    var db = myStorage.indexedDB.db;
    // We can only create Object stores in a setVersion transaction;

    if(db.objectStoreNames.contains("todo")) {
        var storeReq = db.deleteObjectStore("todo");
    }

    var store = db.createObjectStore("todo",
        {keyPath: "timeStamp"});
    
  }

  request.onsuccess = function(e) {
    myStorage.indexedDB.db = e.target.result;
    var db = myStorage.indexedDB.db;

    if (v!= db.version && db.setVersion) {
      var setVrequest = db.setVersion(v);

      // onsuccess is the only place we can create Object Stores
      setVrequest.onerror = myStorage.indexedDB.onerror;
      setVrequest.onsuccess = function(e) {
        if(db.objectStoreNames.contains("todo")) {
          db.deleteObjectStore("todo");
        }

        var store = db.createObjectStore("todo",
          {keyPath: "timeStamp"});

        myStorage.indexedDB.getAllTodoItems();
      };
    }
    else 
        myStorage.indexedDB.getAllTodoItems();
  };

  request.onerror = myStorage.indexedDB.onerror;
}

myStorage.indexedDB.addTodo = function(todoText) {
  var db = myStorage.indexedDB.db;
  var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE);
  var store = trans.objectStore("todo");

  var data = {
    "text": todoText,
    "details": currentDateTime.getTime(),
    "dateCreated": currentDateTime.toUTCString(currentDateTime.getTime()),
    "timeStamp": new Date().getTime()
  };

  var request = store.put(data);

  request.onsuccess = function(e) {
    myStorage.indexedDB.getAllTodoItems();
  };

  request.onerror = function(e) {
    console.log("Error Adding: ", e);
  };
};

myStorage.indexedDB.deleteTodo = function(id) {
  var db = myStorage.indexedDB.db;
  var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE);
  var store = trans.objectStore("todo");

  var request = store.delete(id);

  request.onsuccess = function(e) {
    myStorage.indexedDB.getAllTodoItems();
  };

  request.onerror = function(e) {
    console.log("Error Adding: ", e);
  };
};

myStorage.indexedDB.getTodo = function(id) {
  var db = myStorage.indexedDB.db;
  var trans = db.transaction(["todo"], IDBTransaction.READ_ONLY);
  var store = trans.objectStore("todo");

  var request = store.get(id);

  request.onsuccess = function(e) {
    showDetails(e.target.result);
  };

  request.onerror = function(e) {
    console.log("Error Getting: ", e);
  };

};

myStorage.indexedDB.updateTodo = function(id, newText) {
  var db = myStorage.indexedDB.db;
  var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE);
  var store = trans.objectStore("todo");
    
  var openCursorReq = store.openCursor(IDBKeyRange.only(id));
  openCursorReq.onsuccess = function (event) {
    var cursor = event.target.result;
    var _object = cursor.value;
    _object.dateCreated = currentDateTime.toUTCString(currentDateTime.getTime());
    _object.text = newText;
    var updateRequest = cursor.update(_object);
    updateRequest.onerror = updateRequest.onblocked = function () {
        console.log('Error updating');
    }

    updateRequest.onsuccess = function (event) {
        myStorage.indexedDB.getAllTodoItems();
        clearInput();
    }
  }

};

myStorage.indexedDB.getAllTodoItems = function() {
  var todos = document.getElementById("todoItems");
  todos.innerHTML = "";

  var db = myStorage.indexedDB.db;
  var trans = db.transaction(["todo"], IDBTransaction.READ_WRITE);
  var store = trans.objectStore("todo");

  // Get everything in the store;
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if(!!result == false)
      return;

    renderTodo(result.value);
    result.continue();
  };

  showDetails("");
  cursorRequest.onerror = myStorage.indexedDB.onerror;
};


