const createTicketBtn = document.getElementById("create-ticket-btn");
const submitTicketBtn = document.getElementById("submit-ticket-btn");
const chatMsgInput = document.getElementById("chat-message-input");
const sendMsgBtn = document.getElementById("send-msg-btn");
const ticketSubmissionForm = document.getElementById("ticket-submission-form");
const welcomeMessage = document.getElementById("login-welcome-message");
const ticketTitle = document.getElementById("ticket-title-input");
const chatElem = document.getElementById("chat")
const chatMsgCanvas = document.getElementById("chat-msg-render-canvas");
let socket = undefined;
let currentTicketId = -1;

const sendMessage = () => {
  if (chatMsgInput.value.trim()) {
    if (socket) {
      // execute the codes if the socket is on, i.e. when submitTicket() function is called.
      socket.emit("send-message", {
        ticket_id: currentTicketId,
        message: chatMsgInput.value.trim(),
        created_by: session_user_id,
      });
    }

    const html = `
      <div class="sender-msg">
        <span>${chatMsgInput.value.trim()}</span>
        <span>
          ${new Date().toLocaleTimeString()};
        </span>
      </div>
    `;
    chatMsgCanvas.insertAdjacentHTML("beforeend", html);
    chatMsgInput.value = ""; // clear chat message input field after clicking `send`
  }
};

const submitTicket = async (event) => {
  try {
    event.preventDefault();
    const chat = document.getElementById("chat");
    const ticketStatus = "open"; // set to default value for MVP version
    const ticketPriority = "normal"; // set to default value for MVP version
    const ticketUserId = session_user_id;
    const supportUserId = 2; // set to default value for MVP version; only user with id=2 is a support user

    const ticketData = {
      title: ticketTitle.value,
      status: ticketStatus,
      priority: ticketPriority,
      user_id: ticketUserId,
      support_user_id: supportUserId,
    };

    // sends a POST request to the "/api/ticket/create-ticket" endpoint
    const createTicketResponse = await fetch("/api/ticket/create-ticket", {
      method: "POST",
      body: JSON.stringify(ticketData),
      headers: { "Content-Type": "application/json" },
    });

    if (!createTicketResponse.ok) {
      throw new Error("Failed to create a ticket");
    }

    // extracts JSON data from the response
    const ticketJson = await createTicketResponse.json();
    const ticketId = ticketJson.id;

    // Clicking on ticket submission button (i.e. create a ticket) will also
    ticketSubmissionForm.classList.add("d-none"); // (1) hide the Ticket Submission Form and
    chat.classList.remove("d-none"); // (2) display a chat support box
    renderNewTicket(ticketId, ticketData); // (3) render a new ticket card to ticket stack on the left side of the page

    const ticketMessage = document.getElementById("ticket-message-input").value;

    // const messageData = {
    //   ticket_id: ticketId,
    //   message: ticketMessage,
    //   created_by: session_user_id,
    // };

    currentTicketId = ticketId;
    socket = io();
    chatMsgInput.value = ticketMessage;
    sendMessage();
  } catch (error) {
    console.error(error);
    alert("There is an error in submitting your ticket.");
    // TODO: if the time permits, create an error modal that displays the error message in a user-friendly way and use the codes below instead:
    // const errorElement = document.getElementById('error-message');
    // errorElement.innerText = error.message;
  }
};

const renderNewTicket = (currentTicketId, ticketData) => {
  const newTicketWhenLoggedIn = document.getElementById(
    "render-new-ticket-when-logged-in"
  );

  const html = `
  <a href="#" class="text-decoration-none text-black" data-ticket-id="<%= ticket.id %>" onclick="getMessages(event)">
            <div class="card"> 
              <div class="textBox">
                <div class="textContent lh-1 text-left">
                  <h3>Ticket: ${currentTicketId}</h3>
                  <div class="pt-2">
                    <p>Title:  ${ticketData.title}</p>
                    <p>Status: ${ticketData.status}</p>
                    <p>Status: ${ticketData.priority}</p>
                  </div>
                </div>
              </div>
            </div>
          </a>
  `;
  newTicketWhenLoggedIn.insertAdjacentHTML("beforeend", html); // a newly created ticket card will be placed at the end of the ticket stack
};

const renderPastMessages = (pastMessages) => {

  if(!welcomeMessage.classList.contains("d-none")) { // (1) hide the welcome message if it's being displayed
    welcomeMessage.classList.add("d-none");
  };

  if(!ticketSubmissionForm.classList.contains("d-none")) { // (2) hide the Ticket Submission Form if it's being displayed
    ticketSubmissionForm.classList.add("d-none");
  }

  if(chatElem.classList.contains("d-none")) { // (3) display the chat element if it's being hidden
    chatElem.classList.remove("d-none");
  }

  chatMsgCanvas.innerHTML = ""; // (4) Clear messages in the chatMsgCanvas

  // (5) Render past messages of this specific ticket id to the chatMsgCanvas
  pastMessages.forEach((messageObj) => {
    const formattedDate = dayjs(messageObj.createdAt).format("DD/MM/YYYY HH:mm:ss")
    const html = `
    <div class="sender-msg">
      <span>${messageObj.message}</span>
      <span>
      ${formattedDate}
      </span>
    </div>
  `
  chatMsgCanvas.insertAdjacentHTML('beforeend', html)
  })
}

async function getMessages(event) {
  event.preventDefault();

  const ticketId = event.currentTarget.dataset.ticketId;
  // console.log("ticketId", ticketId)

  const getMessageResponse = await fetch(`/api/messages/${ticketId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  // console.log("getMessageResponse => ", getMessageResponse)

  if (!getMessageResponse.ok) {
    throw new Error("Failed to get past messages");
  }

  const pastMessages = await getMessageResponse.json();
  console.log("messages =>", pastMessages);
  
  renderPastMessages(pastMessages);
  sendMessage;

}

// When clicking on `create a ticket` button, 
createTicketBtn.addEventListener("click", (event) => {
  
  if(!welcomeMessage.classList.contains("d-none")) { // (1) hide the welcome message if it's being displayed
    welcomeMessage.classList.add("d-none");
  };

  if(!chatElem.classList.contains("d-none")) { // (2) hide the chat element if it's being displayed
    chatElem.classList.add("d-none");
  }
  
  ticketSubmissionForm.classList.remove("d-none"); // (3) display a Ticket Submission Form
});

// When clicking on the Ticket Submission Form `submit` button, invoke submitTicket() function.
submitTicketBtn.addEventListener("click", submitTicket);

// When clicking on `send` message button in the chat box, invoke sendMessage() function.
sendMsgBtn.addEventListener("click", sendMessage);
