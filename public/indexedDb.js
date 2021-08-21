function checkForIndexedDb() {
  if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB.");
    return false;
  }
  return true;
}

function useIndexedDb(databaseName, storeName, method, object) {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, 1);
    let db,
      tx,
      store;

    request.onupgradeneeded = function(e) {
      const db = request.result;
      db.createObjectStore(storeName, { autoIncrement: true });
    };

    request.onerror = function(e) {
      console.log("There was an error");
    };

    request.onsuccess = function(e) {
      db = request.result;
      tx = db.transaction(storeName, "readwrite");
      store = tx.objectStore(storeName);

      db.onerror = function(e) {
        console.log("error");
      };
      if (method === "put") {
        store.put(object);
      } else if (method === "get") {
        const all = store.getAll();
        all.onsuccess = function() {
          resolve(all.result);
        };
      } else if (method === "delete") {
        store.delete(object._id);
      } else if (method === "clear") {
        store.clear();
      } else if (method === "add") {
        console.log(object);
        console.log(store);
        store.add(object);
      }
      tx.oncomplete = function() {
        db.close();
      };
    };
  });
}

function saveRecord(transaction) {
  useIndexedDb("budget", "transactions", "add", transaction)
    .then(result => console.log(result))
    .catch(err => console.log(err));
}

function updateDatabase() {
  if (checkForIndexedDb()) {
    useIndexedDb("budget", "transactions", "get").then(results => {
      if (results.length > 0) {
        fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(results),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        })
          .then((response) => response.json())
          .then(data => {
            if (data.errors) {
              errorEl.textContent = "Missing Information";
            }
            else {
              // fetch success, clear indexedDB
              console.log("data was updated to server db successfully");
              useIndexedDb("budget", "transactions", "clear");
            }
          })
          .catch(err => {
            // fetch failed
            console.log(err);
          });
      }
    })
  }
}

window.addEventListener('online', updateDatabase);