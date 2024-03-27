import { BACKEND_PORT } from './config.js';

// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let token = localStorage.getItem('token') || null;
let userId = localStorage.getItem('userId') || null;

const pages = ['login', 'register', 'dashboard', 'threadcreate', 'profile', 'updateMyProfile'];

const goToPage = (newPage) => {
    if (['login', 'register'].includes(newPage)) {
		document.getElementById('nav-logged-out').style.display = 'block';
		document.getElementById('nav-logged-in').style.display = 'none';
	} else {
		document.getElementById('nav-logged-out').style.display = 'none';
		document.getElementById('nav-logged-in').style.display = 'block';
	}
    
    for (const page of pages) {
		document.getElementById(`page-${page}`).style.display = 'none';
	}
	document.getElementById(`page-${newPage}`).style.display = 'block';

    // Reset and load threads if navigating to the dashboard
    if (newPage === 'dashboard') {
        currentPage = 0; // Reset to load the first page of threads
        const threadsContainer = document.getElementById('threads-container');
        while (threadsContainer.firstChild) {
            threadsContainer.removeChild(threadsContainer.firstChild);
        }
        loadThreads(); // Load the initial list of threads

        // Clear existing details
        const threadDetailDiv = document.getElementById('thread-detail');
        threadDetailDiv.innerText = '';
        const threadOptionCOntainerDiv = document.getElementById('thread-option-container');
        threadOptionCOntainerDiv.style.display = 'none'; // Hide initially or when cleared

        // show the dashboard title
        const dashboardTitle = document.getElementById('dashboard-title');
        dashboardTitle.style.display = 'block'; 

        // hide thread details when initializing dashboard
        const dashboardTitleThreaddetail = document.getElementById('dashboard-title-threaddetail');
        dashboardTitleThreaddetail.style.display = 'none'; 
    }
}

document.getElementById('nav-login').addEventListener('click', () => {
    goToPage('login');
    

});

document.getElementById('nav-register').addEventListener('click', () => {
    goToPage('register');
    
});

document.getElementById('nav-dashboard').addEventListener('click', () => {
    goToPage('dashboard');
    
});

document.getElementById('nav-threadcreate').addEventListener('click', () => {
    goToPage('threadcreate');
    
});

document.getElementById('nav-updateMyProfile').addEventListener('click', () => {
    goToPage('updateMyProfile');
    
});

document.getElementById('nav-myProfile').addEventListener('click', () => {
    fetchUserProfile(userId)
    
    goToPage('profile');
    
});


document.getElementById('logout-button').addEventListener('click', () => {
    token = null;
    userId = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    
    goToPage('login');
});


document.getElementById('register-button').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;
    const confirmpassword = document.getElementById('register-confirmpassword').value;

    if (password !== confirmpassword) {
        alertPopup('The passwords do not match. Please try again.');
        return; 
    }

    fetch('http://localhost:5005/' + 'auth/register', {
        method: 'POST',
        
        headers: {
            'Content-type': 'application/json',
        },

        body: JSON.stringify({
            email: email,
            password: password,
            name: name,
        })
    })
        
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            alertPopup(data.error);
        } else {
            token = data.token;
            userId = data.userId;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            goToPage('dashboard');
        
        }
    });

});

document.getElementById('login-button').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    fetch('http://localhost:5005/' + 'auth/login', {
        method: 'POST',
        
        headers: {
        'Content-type': 'application/json',
        },

        body: JSON.stringify({
            email: email,
            password: password,
        })
    })
        
    .then((response) => response.json())
    .then((data) => {
        if (data.error) {
            alertPopup(data.error);
        } else {
            token = data.token;
            userId = data.userId;
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userId);
            goToPage('dashboard');
            
        }
    });

});

document.getElementById('new-thread-submit').addEventListener('click', () => {
	const title = document.getElementById('new-thread-title').value;
	const isPublic = document.getElementById('new-thread-public').checked; // This is a boolean

	const content = document.getElementById('new-thread-content').value;
	
    if (title === "") {
        alertPopup('Title is empty!');
        return;
    }

    if (content === "") {
        alertPopup('Content is empty!');
        return;
    }

	fetch('http://localhost:5005' + '/thread', {
	  method: 'POST',
	  headers: {
        'Content-type': 'application/json',
        'Authorization': token,
      },
	  body: JSON.stringify({
	  	title: title,
	  	isPublic: isPublic,
	  	content: content,
	  })
	}).then((response) => {
		response.json().then((data) => {
			if (data.error) {
				alertPopup(data.error);
			} else {
				goToThread(data.id);
                // Navigate back to the dashboard
                goToPage('dashboard');
			}
		});
	});
});


let currentPage = 0;
const threadsPerPage = 5;
const loadThreads = () => {
    const start = currentPage * threadsPerPage;
    fetch(`http://localhost:5005/threads?start=${start}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
        }
    }).then(response => response.json())
    .then(threads => {
        if (threads.error) {
            alertPopup(threads.error);
        } else {
            const threadsContainer = document.getElementById('threads-container');
            
            // Map each thread ID to a fetch Promise that retrieves the thread's details
            const fetchPromises = threads.map(threadId => 
                fetch(`http://localhost:5005/thread?id=${threadId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token,
                    }
                }).then(response => response.json())
            );

            // Use Promise.all to wait for all fetch calls to complete
            Promise.all(fetchPromises).then(results => {
                results.forEach(threadDetails => {
                    const threadDom = document.createElement('div');
                    threadDom.classList.add('thread-box');

                    const title = document.createElement('h5');
                    title.textContent = threadDetails.title;
                    const postDate = document.createElement('p');
                    postDate.textContent = `Post Date: ${new Date(threadDetails.createdAt).toLocaleDateString()}`;
                    const author = document.createElement('p');
                    author.textContent = `Author: ${threadDetails.creatorId}`;
                    const likes = document.createElement('p');
                    likes.textContent = `${threadDetails.likes.length} likes`;

                    threadDom.appendChild(title);
                    threadDom.appendChild(postDate);
                    threadDom.appendChild(author);
                    threadDom.appendChild(likes);

                    // Adding click event listener to each thread box
                    threadDom.addEventListener('click', () => {
                        goToThread(threadDetails.id);
                    });          

                    threadsContainer.appendChild(threadDom);
                });
                
                // Now the threads will be in the correct order
            }).catch(error => {
                console.error('Error fetching thread details:', error);
            });

            currentPage++; // Increment after loading threads

            // Determine if the "More" button should be displayed
            const loadMoreButton = document.getElementById('load-more-threads');
            if (threads.length < threadsPerPage) {
                loadMoreButton.style.display = 'none';
            } else {
                loadMoreButton.style.display = 'block';
            }
        }
    }).catch(error => console.error('Error fetching threads:', error));
};

function hasUserLikedThread(threadDetails) {
    const userId = parseInt(localStorage.getItem('userId'), 10);
    //console.log(threadDetails.likes);

    return threadDetails.likes.includes(userId);
}


function displayLikeButton(threadDetails) {
    const likeButton = document.getElementById('like-thread-btn');

    // Update button text and appearance based on whether the user has liked the thread
    if (hasUserLikedThread(threadDetails)) {
        likeButton.textContent = 'Unlike';
        likeButton.classList.add('liked');
    } else {
        likeButton.textContent = 'Like';
        likeButton.classList.remove('liked');
    }
}

function hasUserwatchedThread(threadDetails) {
    const userId = parseInt(localStorage.getItem('userId'), 10);
    
    return threadDetails.watchees.includes(userId);
}


function displayWatchButton(threadDetails) {
    const watchButton = document.getElementById('watch-thread-btn');

    if (hasUserwatchedThread(threadDetails)) {
        watchButton.textContent = 'Unwatch';
        watchButton.classList.add('watched');
    } else {
        watchButton.textContent = 'Watch';
        watchButton.classList.remove('watched');
    }
}


function goToThread(threadId) {
    fetch(`http://localhost:5005/thread?id=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token, 
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(threadDetails => {
        const userId = localStorage.getItem('userId');
        
        const dashboardTitle = document.getElementById('dashboard-title');
        dashboardTitle.style.display = 'none'; // Hide the dashboard title

        const dashboardTitleThreaddetail = document.getElementById('dashboard-title-threaddetail');
        dashboardTitleThreaddetail.style.display = 'block'; 
        
        // Clear existing details
        const threadDetailDiv = document.getElementById('thread-detail');
        threadDetailDiv.innerText = '';

        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = threadDetails.title;
        threadDetailDiv.appendChild(titleEl);

        // Body content
        const bodyContentEl = document.createElement('p');
        bodyContentEl.textContent = threadDetails.content; 
        threadDetailDiv.appendChild(bodyContentEl);

        // Number of likes
        const likesEl = document.createElement('h5');
        likesEl.textContent = `${threadDetails.likes.length} likes`;
        threadDetailDiv.appendChild(likesEl);

        // Display the thread detail section if it was hidden
        document.getElementById('page-dashboard').style.display = 'block';
        const threadOptionCOntainerDiv = document.getElementById('thread-option-container');
        threadOptionCOntainerDiv.style.display = 'block'; // Ensure this div is visible


        const editButton = document.getElementById('edit-thread-btn');
        isAdmin(userId).then(isAdminUser => {
            if (threadDetails.creatorId.toString() === userId || isAdminUser) {
                editButton.style.display = 'block';
            } else {
                editButton.style.display = 'none';
            }
        }).catch(error => {
            console.error('Error checking admin status:', error);
            editButton.style.display = 'none'; // Hide the button in case of an error
        });

        const deleteButton = document.getElementById('delete-thread-btn');
        isAdmin(userId).then(isAdminUser => {
            if (threadDetails.creatorId.toString() === userId || isAdminUser) {
                deleteButton.style.display = 'block';
            } else {
                deleteButton.style.display = 'none';
            }
        }).catch(error => {
            console.error('Error checking admin status:', error);
            deleteButton.style.display = 'none'; // Hide the button in case of an error
        });
        
        // hide the edit form div and update info anyways
        document.getElementById('edit-thread').style.display = 'none';

        document.getElementById('edit-thread-id').value = threadId;
        document.getElementById('edit-title').value = threadDetails.title;
        document.getElementById('edit-content').value = threadDetails.content;
        document.getElementById('edit-is-public').checked = threadDetails.isPublic;
        document.getElementById('edit-is-locked').checked = threadDetails.lock;
  
        displayLikeButton(threadDetails);
        displayWatchButton(threadDetails);
    })
    .catch(error => {
        console.error('Error fetching thread details:', error);
        alertPopup('Failed to load thread details.'); 
    });
}


// update my profile
document.getElementById('updateMyProfileForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission behavior

    let formData = {};

    // Only append non-empty fields to formData
    if (document.getElementById('profileEmail').value) {
        formData['email'] = document.getElementById('profileEmail').value;
    }

    if (document.getElementById('profilePassword').value) {
        formData['password'] = document.getElementById('profilePassword').value;
    }

    if (document.getElementById('profileName').value) {
        formData['name'] = document.getElementById('profileName').value;
    }

    const token = localStorage.getItem('token'); // Moved here for scope availability
    const submitProfileUpdate = (updatedFormData) => {
        fetch('http://localhost:5005/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(updatedFormData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            return response.json();
        })
        .then(() => {
            alert("Profile updated successfully!");
            fetchUserProfile(userId); // Make sure this function is defined or implemented correctly
            goToPage('profile'); // Navigate to profile page
        })
        .catch(error => {
            console.error('Error updating profile:', error);
            alert('Error updating profile.');
        });
    };

    const imageFile = document.getElementById('profileImage').files[0];
    if (imageFile) {
        fileToDataUrl(imageFile).then(imageUrl => {
            formData['image'] = imageUrl;
            submitProfileUpdate(formData); // Submit after image processing
        }).catch(error => {
            console.error('Error processing image:', error);
            alert('Error processing image.');
        });
    } else {
        submitProfileUpdate(formData); // Submit without image processing
    }
});




document.getElementById('like-thread-btn').addEventListener('click', function() {
    const lock = document.getElementById('edit-is-locked').checked;
    if (lock) {
        return;
    }
    
    const threadId = document.getElementById('edit-thread-id').value;
    const isLiked = this.classList.contains('liked');
    toggleLikeThread(threadId, !isLiked); // Pass the opposite of the current liked state to toggle it
});

function toggleLikeThread(threadId, isCurrentlyLiked) {
    // Determine the action based on the current liked state
    const action = isCurrentlyLiked;

    fetch(`http://localhost:5005/thread/like`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ id: threadId, turnon: action })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle like');
        }
        return response.json();
    })
    .then(data => {
        const likeButton = document.getElementById('like-thread-btn');
        if (action) { // If the action was to like (turnon: true)
            likeButton.textContent = 'Unlike';
            likeButton.classList.add('liked');
        } else { // If the action was to unlike (turnon: false)
            likeButton.textContent = 'Like';
            likeButton.classList.remove('liked');
        }

        goToThread(threadId);
    })
    .catch(error => {
        console.error('Error toggling like:', error);
        alert('Failed to toggle like.');
    });
}

document.getElementById('watch-thread-btn').addEventListener('click', function() {
    //const lock = document.getElementById('edit-is-locked').checked;
    //if (lock) {
        //return;
    //}

    const threadId = document.getElementById('edit-thread-id').value;
    const isWatched = this.classList.contains('watched');
    toggleWatchThread(threadId, !isWatched); 
});

function toggleWatchThread(threadId, isCurrentlyWatched) {
    const action = isCurrentlyWatched;

    fetch(`http://localhost:5005/thread/watch`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ id: threadId, turnon: action })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle watch');
        }
        return response.json();
    })
    .then(data => {
        const watchButton = document.getElementById('watch-thread-btn');
        if (action) { 
            watchButton.textContent = 'Unwatch';
            watchButton.classList.add('watched');
        } else { 
            watchButton.textContent = 'Watch';
            watchButton.classList.remove('watched');
        }

        goToThread(threadId);
    })
    .catch(error => {
        console.error('Error toggling watch:', error);
        alert('Failed to toggle watch.');
    });
}



// on Click -> Show the edit form div
document.getElementById('edit-thread-btn').addEventListener('click', () => {
    document.getElementById('edit-thread').style.display = 'block';
});

// update the thread when save is pressed
document.getElementById('edit-thread-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const updatedThreadData = {
        id: document.getElementById('edit-thread-id').value,
        title: document.getElementById('edit-title').value,
        content: document.getElementById('edit-content').value,
        isPublic: document.getElementById('edit-is-public').checked,
        lock: document.getElementById('edit-is-locked').checked
    };

    // Call the API to update the thread 
    updateThread(updatedThreadData)
    .then(() => {
        // Hide the edit form div upon successful update
        document.getElementById('edit-thread').style.display = 'none';

        goToThread(updatedThreadData.id);
        goToPage('dashboard');
    })
    .catch(error => {
        console.error('Failed to update thread:', error);
        alertPopup('Failed to update thread.');
    });
});



// give userID and api all to fetch user info, and show user info on profile page
function fetchUserProfile(userId) {
    const token = localStorage.getItem('token');
    const url = `http://localhost:5005/user?userId=${userId}`; 

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }
        return response.json();
    })
    .then(user => {
        document.getElementById('userId').textContent = user.id;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userAdmin').textContent = user.admin ? "Yes" : "No"; 
        
        const profileImage = user.image ? user.image : './defaultuserimg.jpg'; 
        document.getElementById('userImage').src = profileImage;
        document.getElementById('userImage').alt = `Profile image unavailable`;

        goToPage('profile');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error loading profile');
    });
}


function updateThread(updatedThreadData) {
    return fetch(`http://localhost:5005/thread`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify({
            id: updatedThreadData.id,
            title: updatedThreadData.title,
            content: updatedThreadData.content,
            isPublic: updatedThreadData.isPublic, 
            lock: updatedThreadData.lock
        })
    })
    .then(response => {
        if (!response.ok) {
            alertPopup('Failed to update thread');
        }
        return response.json(); 
    });
}

document.getElementById('delete-thread-btn').addEventListener('click', () => {
    const threadId = document.getElementById('edit-thread-id').value;

    if (threadId) {
        deleteThread(threadId)
            .then(() => {
                alertPopup('Thread deleted successfully.');
                
                goToPage('dashboard');
            })
            .catch(error => {
                console.error('Failed to delete thread:', error);
                alertPopup('Failed to delete thread.');
            });
    } else {
        alertPopup('No thread ID found for deletion');
    }
});

function deleteThread(threadId) {
    return fetch(`http://localhost:5005/thread`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, 
        },
        body: JSON.stringify({
            id: threadId
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete the thread');
        }
        return response.json();
    });
}

function isAdmin(userId) {
    return new Promise((resolve, reject) => {
        fetch(`http://localhost:5005/user?userId=${userId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token, // Ensure token is correctly initialized
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(userDetails => {
            if (userDetails.admin === true) {
                resolve(true);
            } else {
                resolve(false);
            }
        })
        .catch(error => {
            alertPopup('Failed to load user details.'); 
            reject(error); // Reject the promise on error
        });
    });
}


// Event listener for the "More" button
document.getElementById('load-more-threads').addEventListener('click', () => {
    loadThreads();
});

if (localStorage.getItem('token')) { 
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');
    goToPage('dashboard');
} else {
    goToPage('login');
}

// Function to show the alert popup
function alertPopup(content) {
    document.getElementById('popupContent').textContent = content;
    document.getElementById('customPopup').style.display = 'block';
}

// Function to close the popup
function closePopup() {
    document.getElementById('customPopup').style.display = 'none';
}

// Event listener for the close button
document.getElementById('closePopup').addEventListener('click', closePopup);

// Dark Mode
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');

if (currentTheme == 'dark') {
    document.body.classList.add('dark-mode');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    let theme = 'light';
    if (document.body.classList.contains('dark-mode')) {
        theme = 'dark';
    }
    localStorage.setItem('theme', theme);
});
