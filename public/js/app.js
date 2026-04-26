async function requestMentor(name){

await fetch("/api/request",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({mentor:name})
});

alert("Mentor request sent");

}

async function bookSession(name){

await fetch("/api/session",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({mentor:name})
});

alert("Session booked");

}

async function loadStats(){

const res = await fetch("/api/stats");
const data = await res.json();

document.getElementById("stats").innerHTML=
`
<p>Mentors: ${data.mentors}</p>
<p>Requests: ${data.requests}</p>
<p>Sessions: ${data.sessions}</p>
`;

}

async function loadActivity(){

const res = await fetch("/api/activities");
const data = await res.json();

let html="";

data.forEach(a=>{
html+=`<li>${a}</li>`;
});

document.getElementById("activity").innerHTML=html;

}

if(document.getElementById("stats")){
loadStats();
loadActivity();
}