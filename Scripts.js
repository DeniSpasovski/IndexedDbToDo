var myStorage = {};


myStorage.indexedDB = {};

myStorage.indexedDB.onerror = function(e) {
	console.log(e);
};

myStorage.indexedDB.create = function() {
	var request = indexedDB.open("todos");
	request.onupgradeneeded = function (e) {
		var db = e.target.result;

		if (db.objectStoreNames.contains("todo")) {
			var storeReq = db.deleteObjectStore("todo");
		}

		var store = db.createObjectStore("todo", {keyPath: "timeStamp"});
		store.createIndex('nametimestamp', ['text', 'timeStamp']);
	};

	request.onsuccess = function(e) {
		e.target.result.close();
		myStorage.indexedDB.getAllTodoItems();
	};

	request.onerror = myStorage.indexedDB.onerror;
};

myStorage.indexedDB.addTodo = function(todoText) {
	var request = indexedDB.open("todos");
	request.onsuccess = function(e) {
		var db = e.target.result;
		var trans = db.transaction(["todo"], myStorage.IDBTransactionModes.READ_WRITE);
		var store = trans.objectStore("todo");
		var currentDateTime = new Date();
		
		var data = {
			"text": todoText,
			"details": currentDateTime.getTime(),
			"dateCreated": currentDateTime.toUTCString(currentDateTime.getTime()),
			"timeStamp": new Date().getTime()
		};

		var request = store.put(data);

		trans.oncomplete = function(e){
			myStorage.indexedDB.getAllTodoItems();
			db.close();
		};

		request.onerror = function(e) {
			console.log("Error Adding: ", e);
		};
	};
	request.onerror = myStorage.indexedDB.onerror;
};

//Delete Item
myStorage.indexedDB.deleteTodo = function(id) {
	var request = indexedDB.open("todos");
	request.onsuccess = function(e) {
		var db = e.target.result;
		var trans = db.transaction(["todo"], myStorage.IDBTransactionModes.READ_WRITE);
		var store = trans.objectStore("todo");
		var request = store.delete(id);

		trans.oncomplete = function(e) {
			db.close();
			myStorage.indexedDB.getAllTodoItems();
		};

		request.onerror = function(e) {
			console.log("Error Adding: ", e);
		};
	};
	request.onerror = myStorage.indexedDB.onerror;
};

//Gets the first to do item by ID
myStorage.indexedDB.getTodo = function(id) {
	var request = indexedDB.open("todos");
	request.onsuccess = function(e) {
		var db = e.target.result;
		var trans = db.transaction(["todo"], myStorage.IDBTransactionModes.READ_ONLY);
		var store = trans.objectStore("todo");

		var storeRequest = store.get(id);

		storeRequest.onsuccess = function(e) {
			showDetails(e.target.result);
		};
		
		trans.oncomplete = function(e) {
			db.close();
		};

		storeRequest.onerror = function(e) {
			console.log("Error Getting: ", e);
		};
	};
	request.onerror = myStorage.indexedDB.onerror;
};

//Gets the last created item by Date (not last updated)
myStorage.indexedDB.searchTodo = function (value) {
    var request = indexedDB.open("todos");
	request.onsuccess = function(e) {
		var db = e.target.result;
		var trans = db.transaction(["todo"], myStorage.IDBTransactionModes.READ_ONLY);
		var store = trans.objectStore("todo");
		var index = store.index('nametimestamp');
		var keyRange = IDBKeyRange.bound([value,0],[value,new Date().getTime()])
        var openCursorRequest = index.openCursor(keyRange, 'prev');

		openCursorRequest.onsuccess = function(e) {
			if(e.target.result)
				showDetails(e.target.result.value);
			else
				showDetails("");
		};
		
		trans.oncomplete = function(e) {
			db.close();
		};

		openCursorRequest.onerror = function(e) {
			console.log("Error Getting: ", e);
		};
	};
	request.onerror = myStorage.indexedDB.onerror;
}

myStorage.indexedDB.updateTodo = function(id, newText) {
	var request = indexedDB.open("todos");
	request.onsuccess = function(e) {
		var db = e.target.result;
		var trans = db.transaction(["todo"], myStorage.IDBTransactionModes.READ_WRITE);
		var store = trans.objectStore("todo");
		
		var openCursorReq = store.openCursor(IDBKeyRange.only(id));
		openCursorReq.onsuccess = function (event) {
			var cursor = event.target.result;
			var _object = cursor.value;
			var currentDateTime = new Date();
			_object.dateCreated = currentDateTime.toUTCString(currentDateTime.getTime());
			_object.text = newText;
			var updateRequest = cursor.update(_object);
			updateRequest.onerror = updateRequest.onblocked = function () {
				console.log('Error updating');
			};

			updateRequest.onsuccess = function (event) {
				clearInput();
			};
			
			trans.oncomplete = function(e) {
				db.close();
				myStorage.indexedDB.getAllTodoItems();
			};
		}
	};
	request.onerror = myStorage.indexedDB.onerror;
};

myStorage.indexedDB.getAllTodoItems = function() {
	var request = indexedDB.open("todos");
	request.onsuccess = function(e) {
		var todos = document.getElementById("todoItems");
		todos.innerHTML = "";

		var db = e.target.result;		
		var trans = db.transaction(["todo"], myStorage.IDBTransactionModes.READ_WRITE);
		var store = trans.objectStore("todo");

		// Get everything in the store;
		var keyRange = IDBKeyRange.lowerBound(0);
		var cursorRequest = store.openCursor(keyRange);

		cursorRequest.onsuccess = function(e) {
			var result = e.target.result;
			if(!!result == false){
				return;
			}
		
			renderTodo(result.value);
			result.continue();
		};
		
		trans.oncomplete = function(e) {
			db.close();
		};

		showDetails("");
		cursorRequest.onerror = myStorage.indexedDB.onerror;
	};
	request.onerror = myStorage.indexedDB.onerror;
};

myStorage.indexedDB.deleteDB = function (){
	var deleteRequest = indexedDB.deleteDatabase("todos");
    deleteRequest.onsuccess = function (e)
    {
		alert("deleted");
		myStorage.indexedDB.create();
    }
	deleteRequest.onblocked = function (e)
    {
		alert("blocked");
    }
	deleteRequest.onerror = myStorage.indexedDB.onerror;
};

myStorage.IDBTransactionModes = { "READ_ONLY": "readonly", "READ_WRITE": "readwrite", "VERSION_CHANGE": "versionchange" }; 

