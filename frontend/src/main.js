import { BACKEND_PORT } from './config.js';

// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let token = localStorage.getItem('token') || null;

const pages = ['login', 'register', 'dashboard', 'threadcreate'];

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
        threadDetailDiv.style.display = 'none'; // Hide initially or when cleared

        // show the dashboard title
        const dashboardTitle = document.getElementById('dashboard-title');
        dashboardTitle.style.display = 'block'; 

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


document.getElementById('logout-button').addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    
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
            localStorage.setItem('token', token);
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
            localStorage.setItem('token', token);
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

function goToThread(threadId) {
    fetch(`http://localhost:5005/thread?id=${threadId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token, // Ensure your token is correctly initialized
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(threadDetails => {
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
        bodyContentEl.textContent = threadDetails.content; // Assuming 'content' is the key for body content
        threadDetailDiv.appendChild(bodyContentEl);

        // Number of likes
        const likesEl = document.createElement('h5');
        likesEl.textContent = `${threadDetails.likes.length} likes`;
        threadDetailDiv.appendChild(likesEl);

        // Display the thread detail section if it was hidden
        document.getElementById('page-dashboard').style.display = 'block';
        threadDetailDiv.style.display = 'block'; // Ensure this div is visible
    })
    .catch(error => {
        console.error('Error fetching thread details:', error);
        alertPopup('Failed to load thread details.'); // Ensure you have an alertPopup function or use a standard alert()
    });
}


// Event listener for the "More" button
document.getElementById('load-more-threads').addEventListener('click', () => {
    loadThreads();
});

if (localStorage.getItem('token')) {
    token = localStorage.getItem('token');
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
