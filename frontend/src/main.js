import { BACKEND_PORT } from './config.js';

// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

let token = null;

const pages = ['login', 'register', 'dashboard'];

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
}

document.getElementById('nav-login').addEventListener('click', () => {
    goToPage('login');
    

});

document.getElementById('nav-register').addEventListener('click', () => {
    goToPage('register');
    
});


document.getElementById('logout-button').addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    
    goToPage('login');
});


document.getElementById('register-button').addEventListener('click', () => {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    // TODO
    const confirmpassword = document.getElementById('register-confirmpassword').value;

    const name = document.getElementById('register-name').value;


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
            alert(data.error);
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
            alert(data.error);
        } else {
            token = data.token;
            localStorage.setItem('token', token);
            goToPage('dashboard');
            
        }
    });

});


const domClickListen = (element, fn) => {
	document.getElementById(element).addEventListener('click', fn);
}


document.getElementById('new-thread-submit').addEventListener('click', () => {
	const title = document.getElementById('new-thread-title').value;
	const isPublic = document.getElementById('new-thread-public').checked; // This is a boolean

	const content = document.getElementById('new-thread-content').value;
	console.log({
	  	title: title,
	  	isPublic: isPublic,
	  	content: content,
	  })
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
				alert(data.error);
			} else {
				loadThreads();
			}
		});
	});
});

const loadThreads = () => {
	fetch('http://localhost:5005' + '/threads', {
	  method: 'GET',
	  headers: {
        'Content-type': 'application/json',
        'Authorization': token,
      }
	}).then((response) => {
		response.json().then((data) => {
			if (data.error) {
				alert(data.error);
			} else {
				document.getElementById('threads').innerText = '';
				for (const threadId of data) {
					const threadDom = document.createElement('div');
					threadDom.innerText = threadId;
					document.getElementById('threads').appendChild(threadDom);
				}
			}
		});
	});
};


if (localStorage.getItem('token')) {
	token = localStorage.getItem('token');
	goToPage('dashboard');
	loadThreads();
} else {
	goToPage('login');
}