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
      db.createObjectStore(storeName, { keyPath: "_id" });
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
      }
      tx.oncomplete = function() {
        db.close();
      };
    };
  });
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
              // clear form
              nameEl.value = "";
              amountEl.value = "";
            }
          })
          .catch(err => {
            // fetch failed, so save in indexed db
            saveRecord(transaction);
        
            // clear form
            nameEl.value = "";
            amountEl.value = "";
          });
      }
    })
  }
}

window.addEventListener('online', updateDatabase);