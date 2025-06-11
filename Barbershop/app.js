(() => {
  // Services price map for price hint
  const servicePrices = {
    'Normal Cutting': 18,
    'Relaxing': 125,
    'Rebonding': 100,
    'Keratin': 300,
    'Perming': 300,
    'Coloring': 50
  };

  const bookingForm = document.getElementById('booking-form');
  const bookingMessage = document.getElementById('booking-message');
  const reviewForm = document.getElementById('review-form');
  const reviewsList = document.getElementById('reviews-list');
  const noReviews = document.getElementById('no-reviews');
  const serviceSelect = bookingForm.elements['service'];
  const serviceHelp = document.getElementById('service-help');
  const dateInput = bookingForm.elements['date'];
  const timeInput = bookingForm.elements['time'];

  // Set min date to today and min time to now + 1 hour rounded to next 30 minutes
  function setMinDateTime() {
    const now = new Date();
    // Set min date to today
    const todayStr = now.toISOString().split('T')[0];
    dateInput.min = todayStr;

    // Calculate min time: now + 1 hour rounded up to next 30 minutes
    now.setHours(now.getHours() + 1);
    const minutes = now.getMinutes();
    const roundedMinutes = minutes <= 30 ? 30 : 0;
    if (roundedMinutes === 0) {
      now.setHours(now.getHours() + 1);
    }
    now.setMinutes(roundedMinutes, 0, 0);

    // Format time as HH:mm
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const minTimeStr = `${hh}:${mm}`;
    timeInput.min = minTimeStr;
  }
  setMinDateTime();

  // Update price info on service change
  serviceSelect.addEventListener('change', () => {
    const val = serviceSelect.value;
    if (val && servicePrices[val]) {
      serviceHelp.textContent = `Price: RM ${servicePrices[val]}`;
    } else {
      serviceHelp.textContent = '';
    }
  });

  // Utility: Render reviews UI
  function renderReviews(reviews) {
    reviewsList.innerHTML = '';
    if (!reviews.length) {
      noReviews.hidden = false;
      return;
    }
    noReviews.hidden = true;
    // Show latest first
    reviews.slice().reverse().forEach(r => {
      const art = document.createElement('article');
      // Render star rating visually with graphical stars
      const starContainer = document.createElement('div');
      starContainer.className = 'star-rating';
      for (let i = 5; i >= 1; i--) {
        const starSpan = document.createElement('span');
        if (r.rating >= i) {
          starSpan.className = 'filled';
        }
        starSpan.textContent = '★';
        starContainer.appendChild(starSpan);
      }
      art.appendChild(starContainer);
      const reviewTextDiv = document.createElement('div');
      reviewTextDiv.textContent = r.text;
      art.appendChild(reviewTextDiv);
      reviewsList.appendChild(art);
    });
  }

  // Fetch reviews and render
  function loadReviews() {
    fetch('data.php?action=getReviews')
      .then(res => res.json())
      .then(data => renderReviews(data))
      .catch(() => {
        reviewsList.innerHTML = '<p class="no-data">Failed to load reviews.</p>';
      });
  }

  // Booking form submit handler
  bookingForm.addEventListener('submit', e => {
    e.preventDefault();
    bookingMessage.textContent = '';
    bookingMessage.style.color = '#059669'; // reset color to green success

    const formData = new FormData(bookingForm);
    const name = formData.get('customerName').trim();
    const service = formData.get('service');
    const barber = formData.get('barber');
    const date = formData.get('date');
    const time = formData.get('time');

    if (!name || !service || !barber || !date || !time) {
      bookingMessage.style.color = '#b91c1c'; // red
      bookingMessage.textContent = 'Please fill all fields correctly.';
      return;
    }

    // Combine date and time into a single Date object
    const dateTimeStr = `${date}T${time}:00`;
    const selectedDateTime = new Date(dateTimeStr);

    // Calculate min datetime for validation
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const minutes = now.getMinutes();
    const roundedMinutes = minutes <= 30 ? 30 : 0;
    if (roundedMinutes === 0) {
      now.setHours(now.getHours() + 1);
    }
    now.setMinutes(roundedMinutes, 0, 0);

    if (selectedDateTime < now) {
      bookingMessage.style.color = '#b91c1c';
      bookingMessage.textContent = 'Please select a valid date and time at least 1 hour from now.';
      return;
    }

    // Append combined dateTime to formData for backend compatibility
    formData.append('dateTime', dateTimeStr);

    fetch('data.php?action=saveBooking', {
      method: 'POST',
      body: new URLSearchParams(formData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then((res) => res.json())
      .then(data => {
        if (data.success) {
          bookingMessage.textContent = 'Appointment booked successfully!';
          bookingForm.reset();
          serviceHelp.textContent = '';
          setMinDateTime();
        } else {
          bookingMessage.style.color = '#b91c1c';
          bookingMessage.textContent = 'Failed to book appointment. Try again.';
        }
      }).catch(() => {
        bookingMessage.style.color = '#b91c1c';
        bookingMessage.textContent = 'Network error. Please try again later.';
      });
  });

  // Review form submit handler
  reviewForm.addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(reviewForm);
    const text = formData.get('reviewText').trim();
    const rating = formData.get('reviewRating');

    if (!text || text.length < 10) {
      alert('Review must be at least 10 characters.');
      return;
    }

    // Append rating to form data
    formData.append('rating', rating);

    fetch('data.php?action=saveReview', {
      method: 'POST',
      body: new URLSearchParams(formData),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).then(res => res.json())
      .then(data => {
        if (data.success) {
          reviewForm.reset();
          loadReviews();
          alert('Thank you for your review!');
        } else {
          alert('Failed to submit review. Please try again.');
        }
      }).catch(() => {
        alert('Network error. Please try again later.');
      });
  });

  loadReviews();
})();
