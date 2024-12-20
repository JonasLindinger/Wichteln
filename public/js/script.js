document.addEventListener('DOMContentLoaded', () => {
    console.log('JavaScript started!');

    let users = [];

    const addNewUserBtn = document.querySelector(".add_user_btn");
    const newUserName = document.querySelector(".newUserName");
    if (!(addNewUserBtn === null || addNewUserBtn === undefined)) {
        addNewUserBtn.addEventListener("click", (e) => addUser());
    }
    function addUser() {
        // Get name
        const userName = newUserName.value.trim();

        // Check if name exists already
        if (userName && !users.includes(userName)) {
            // Add to list and update display.
            users.push(userName);
            updateUserList();
            newUserName.value = "";
        }
    }

    const userList = document.querySelector(".new_user_list");
    function updateUserList() {
        // Clear
        userList.innerHTML = "";

        users.forEach((userName, index) => {
            // Create User List Item
            const li = document.createElement("li");
            li.innerText = userName;

            // Create Remove button
            const removeBtn = document.createElement("button");
            removeBtn.innerText = "X";

            // When clicked, remove item and update display
            removeBtn.addEventListener("click", (e) => {
                users.splice(index, 1);
                updateUserList();
            });

            li.appendChild(removeBtn);
            userList.appendChild(li);
        });
    }

    const joinGroupBtn = document.querySelector(".join_group_btn");
    const joinGroupInput = document.querySelector(".join_group_input");
    if (!(joinGroupBtn === null || joinGroupBtn === undefined || joinGroupInput === null || joinGroupInput === undefined)) {
        joinGroupBtn.addEventListener("click", (e) => joinGroup())
    }
    function joinGroup() {
        window.location.href = "/groups/" + joinGroupInput.value;
    }

    const submit_new_group_btn = document.querySelector(".submit_new_group_btn");
    if (!(submit_new_group_btn === null || submit_new_group_btn === undefined)) {
        submit_new_group_btn.addEventListener("click", (e) => submitNewGroupForm())
    }
    async function submitNewGroupForm() {
        if (users.length < 3) {
            alert("Gruppe muss mindestens 3 Teilnehmer haben!");
            return;
        }


        const data = { users };
        const response = await fetch("/groups/new", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await response.json();
        if (result.success) {
            console.log("Group created.");
            window.location.href = "/groups/" + result.groupName;
        } else {
            alert(result.message || "Error creating group.");
        }
    }

    const seeGroupInfoBtn = document.querySelector(".see_group_info_btn");
    const seeGroupInfoCode = document.querySelector(".see_group_info_code");
    if (!(seeGroupInfoBtn === null || seeGroupInfoBtn === undefined)) {
        seeGroupInfoBtn.addEventListener("click", (e) => seeGroupInfo())
    }
    async function seeGroupInfo() {
        const groupName = seeGroupInfoCode.value.trim();
        if (groupName.length !== 8) {
            alert("Code is invalid.");
            return;
        }

        console.log("redirect");
        window.location.href = "/groups/" + groupName;
    }

    document.querySelectorAll(".group_user").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            window.location.href = window.location + "?name=" + btn.name;
        })
    });
});