const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');
const serviceAccount = require('./service-account-file.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Function to wait for a specified number of milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to update the redirect URL
async function updateRedirectUrl(linkID, newURL, apiKey) {
  try {
    const response = await axios.post(`https://api.short.io/links/${linkID}`, {
      originalURL: newURL,
    }, {
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log(`Link ID: ${linkID} updated successfully to ${newURL}`);
    } else {
      console.log(`Failed to update Link ID: ${linkID}. Status Code: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error updating Link ID: ${linkID}`, error);
  }
}

async function cycleThroughUrlsAndAutoChange() {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
  
    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      if (userData.autochange) {
        const listRef = db.collection('users').doc(userDoc.id).collection('ListOfLinks');
        const listSnapshot = await listRef.get();
  
        if (!listSnapshot.empty) {
          // Assuming URLs are stored in fields named url1, url2, ..., urlN
          // Retrieve them and sort if needed
          let urls = [];
          listSnapshot.forEach(doc => {
            const data = doc.data();
            Object.keys(data).forEach(key => {
              if (key.startsWith('url')) {
                urls.push(data[key]);
              }
            });
          });
  
          // Ensure the URLs are processed in the correct order (if necessary)
          urls.sort((a, b) => /* your sorting logic here */ 0);
  
          // Now loop through the sorted URLs and update
          for (const [index, url] of urls.entries()) {
            console.log(`Updating to URL ${index + 1}: ${url}`);
            await updateRedirectUrl(userData.linkID, url, userData.apikey);
            if (index < urls.length - 1) {
              console.log(`Waiting to update next URL...`);
              await wait(12000); // Wait for 12 seconds
            }
          }
          console.log(`FULLY DONE for user ${userDoc.id}`);
        } else {
          console.log(`No ListOfLinks for user ID: ${userDoc.id}`);
        }
      }
    }
  }
  

cycleThroughUrlsAndAutoChange().catch(console.error);
