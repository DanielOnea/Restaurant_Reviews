let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			DBHelper.fetchRestaurantReviews(self.restaurant, (error, reviews) => {
				self.restaurant.reviews = reviews;
				if (!reviews) {
					console.error(error);
				}
				fillRestaurantHTML();
				callback(null, restaurant)
			});
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
 fillRestaurantHTML = (restaurant = self.restaurant) => {
   const name = document.getElementById('restaurant-name');
   name.innerHTML = restaurant.name;

   const address = document.getElementById('restaurant-address');
   address.innerHTML = restaurant.address;

   const image = document.getElementById('restaurant-img');
   image.className = 'restaurant-img'
   image.src = DBHelper.imageUrlForRestaurant(restaurant);
   image.alt = DBHelper.getPhotoDescription(restaurant);

   const cuisine = document.getElementById('restaurant-cuisine');
   cuisine.innerHTML = restaurant.cuisine_type;

   // fill operating hours
   if (restaurant.operating_hours) {
     fillRestaurantHoursHTML();
   }
   // fill reviews
   fillReviewsHTML();
 }

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
 fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
   const hours = document.getElementById('restaurant-hours');
   for (let key in operatingHours) {
     const row = document.createElement('tr');

     const day = document.createElement('td');
     day.innerHTML = key;
     row.appendChild(day);

     const time = document.createElement('td');
     time.innerHTML = operatingHours[key];
     row.appendChild(time);

     hours.appendChild(row);
   }
 }


/**
 * Create all reviews HTML and add them to the webpage.
 */
 fillReviewsHTML = (reviews = self.restaurant.reviews) => {
   const container = document.getElementById('reviews-container');
   const title = document.createElement('h2');
   title.innerHTML = 'Reviews';
   container.appendChild(title);

   if (!reviews) {
     const noReviews = document.createElement('p');
     noReviews.innerHTML = 'No reviews yet!';
     container.appendChild(noReviews);
     return;
   }
   const ul = document.getElementById('reviews-list');
   reviews.forEach(review => {
     ul.appendChild(createReviewHTML(review));
   });
   container.appendChild(ul);
 }


/**
 * Create review HTML and add it to the webpage.
 */
 createReviewHTML = (review) => {
   const li = document.createElement('li');
   const name = document.createElement('p');
   name.innerHTML = review.name;
   name.className = 'review-name';
   name.title = "reviewer's name";
   li.appendChild(name);

   const date = document.createElement('p');
   date.innerHTML = review.date;
   date.className = 'review-date';
   date.title = 'date when review was posted';
   li.appendChild(date);

   const rating = document.createElement('p');
   rating.innerHTML = `Rating: ${review.rating}`;
   rating.className = 'review-rating';
   rating.title = 'given rating';
   li.appendChild(rating);

   const comments = document.createElement('p');
   comments.innerHTML = review.comments;
   comments.className = 'review-comments';
   comments.title = 'comments from the reviewer';
   li.appendChild(comments);

   return li;
 }

const form = document.getElementById("reviewForm");
form.addEventListener("submit", function (event) {
	event.preventDefault();
	let review = {"restaurant_id": self.restaurant.id};
	const formdata = new FormData(form);
	for (var [key, value] of formdata.entries()) {
		review[key] = value;
	}
	DBHelper.submitReview(review)
		.then(data => {
			const ul = document.getElementById('reviews-list');
			ul.appendChild(createReviewHTML(review));
			form.reset();
		})
		.catch(error => console.error(error))
});

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
 fillBreadcrumb = (restaurant=self.restaurant) => {
   const breadcrumb = document.getElementById('breadcrumb');
   const li = document.createElement('li');
   li.innerHTML = restaurant.name;
   breadcrumb.appendChild(li);
 }

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}