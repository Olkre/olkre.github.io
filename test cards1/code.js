// listen for the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    // retrieve the JSON file using the fetch function
    fetch('info.json')
      // convert the response to JSON
      .then(response => response.json())
      .then(data => {
        // iterate over the data in the JSON file
        for (let i = 0; i < data.length; i++) {
          // create a new card element
          var card = document.createElement('div');
          card.classList.add('card');
  
          // set the text content of the placeholder elements to the corresponding values from the JSON data
          card.querySelector('.card-title').textContent = data[i].title;
          card.querySelector('.card-description').textContent = data[i].description;
  
          // append the card to the container element
          document.querySelector('.card-container').appendChild(card);
        }
      })
      .catch(error => console.error(error)); // log any errors to the console
  });
  