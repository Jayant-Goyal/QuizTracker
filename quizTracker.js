/* ==============================
   TIMER & GLOBAL VARS
   ============================== */
   let timerInterval;
   let isTimerRunning = false;
   let startTime, pausedTime = 0;
   
   function updateStopwatch() {
     let elapsed;
     if (isTimerRunning) {
       elapsed = Date.now() - startTime + pausedTime;
     } else {
       elapsed = pausedTime;
     }
     const hours = Math.floor(elapsed / 3600000);
     const minutes = Math.floor((elapsed % 3600000) / 60000);
     const seconds = Math.floor((elapsed % 60000) / 1000);
     document.getElementById("hr").innerText = hours.toString().padStart(2, "0");
     document.getElementById("min").innerText = ":" + minutes.toString().padStart(2, "0");
     document.getElementById("sec").innerText = ":" + seconds.toString().padStart(2, "0");
   }
   
   function startTimer() {
     if (!isTimerRunning) {
       startTime = Date.now();
       timerInterval = setInterval(updateStopwatch, 1000);
       isTimerRunning = true;
       updateStopwatch();
       const timerEl = document.getElementById("timer");
       timerEl.classList.add("running");
       timerEl.classList.remove("paused");
     }
   }
   
   function pauseTimer() {
     if (isTimerRunning) {
       clearInterval(timerInterval);
       pausedTime += Date.now() - startTime;
       isTimerRunning = false;
       updateStopwatch();
       const timerEl = document.getElementById("timer");
       timerEl.classList.add("paused");
       timerEl.classList.remove("running");
     }
   }
   
   function resetTimer() {
     clearInterval(timerInterval);
     isTimerRunning = false;
     startTime = 0;
     pausedTime = 0;
     updateStopwatch();
     const timerEl = document.getElementById("timer");
     timerEl.classList.remove("running", "paused");
   }
   
   document.getElementById("timer").addEventListener("click", function () {
     if (isTimerRunning) {
       pauseTimer();
     } else {
       startTimer();
     }
   });
   
   document.getElementById("timer").addEventListener("dblclick", function () {
     resetTimer();
   });
   
   /* ==============================
      MAIN CLASS
      ============================== */
   class QuizTracker {
     constructor() {
       // Check for unsaved session in localStorage
       const savedSession = localStorage.getItem("currentQuizSession");
       if (savedSession) {
         const data = JSON.parse(savedSession);
         if (data.user_inputs && data.user_inputs.length > 0) {
           this._pendingSessionData = data;
           this.questions_attempted = 0;
           this.questions_not_attempted = 0;
           this.correct_answers = 0;
           this.incorrect_answers = 0;
           this.user_inputs = [];
   
           document.getElementById("resumeQuizModal").classList.remove("hidden");
   
           document.getElementById("resumeQuizYes").onclick = () => {
             this.savePendingDataToHistory();
             this.questions_attempted = data.questions_attempted || 0;
             this.questions_not_attempted = data.questions_not_attempted || 0;
             this.correct_answers = data.correct_answers || 0;
             this.incorrect_answers = data.incorrect_answers || 0;
             this.user_inputs = data.user_inputs || [];
             this._pendingSessionData = null;
             localStorage.removeItem("currentQuizSession");
             document.getElementById("resumeQuizModal").classList.add("hidden");
             this.updateDisplay();
           };
   
           document.getElementById("resumeQuizNo").onclick = () => {
             localStorage.removeItem("currentQuizSession");
             this._pendingSessionData = null;
             document.getElementById("resumeQuizModal").classList.add("hidden");
             this.questions_attempted = 0;
             this.questions_not_attempted = 0;
             this.correct_answers = 0;
             this.incorrect_answers = 0;
             this.user_inputs = [];
             this.updateDisplay();
           };
   
           document.getElementById("resumeQuizSave").onclick = () => {
             this.savePendingDataToHistory();
             localStorage.removeItem("currentQuizSession");
             this._pendingSessionData = null;
             document.getElementById("resumeQuizModal").classList.add("hidden");
             this.questions_attempted = 0;
             this.questions_not_attempted = 0;
             this.correct_answers = 0;
             this.incorrect_answers = 0;
             this.user_inputs = [];
             this.updateDisplay();
           };
         } else {
           localStorage.removeItem("currentQuizSession");
           this.questions_attempted = 0;
           this.questions_not_attempted = 0;
           this.correct_answers = 0;
           this.incorrect_answers = 0;
           this.user_inputs = [];
         }
       } else {
         this.questions_attempted = 0;
         this.questions_not_attempted = 0;
         this.correct_answers = 0;
         this.incorrect_answers = 0;
         this.user_inputs = [];
       }
   
       // Load existing history from localStorage
       this.history = JSON.parse(localStorage.getItem("quizHistory")) || [];
       this.correct_answer_value =
         Number(localStorage.getItem("correct_answer_value")) || 5;
       this.incorrect_answer_value =
         Number(localStorage.getItem("incorrect_answer_value")) || -1;
   
       window.addEventListener("resize", () => this.updateAnswerMenu());
       this.updateDisplay();
   
       let viewAllBtn = document.getElementById("viewAllButton");
       if (viewAllBtn) {
         viewAllBtn.addEventListener("click", () => {
           this.displayFullAnswerMenu();
         });
       }
     }
   
     savePendingDataToHistory() {
       if (!this._pendingSessionData) return;
       let data = this._pendingSessionData;
       const positiveMarks = data.correct_answers * this.correct_answer_value;
       const negativeMarks = data.incorrect_answers * this.incorrect_answer_value;
       const totalMarks = positiveMarks + negativeMarks;
       const maxMarks =
         (data.questions_attempted + data.questions_not_attempted) *
         this.correct_answer_value;
       const percentage = maxMarks ? (totalMarks / maxMarks) * 100 : 0;
       const nonnegativePercentage = maxMarks ? (positiveMarks / maxMarks) * 100 : 0;
   
       const partialHistory = {
         timestamp: new Date().toISOString(),
         results: {
           questions_attempted: data.questions_attempted,
           questions_not_attempted: data.questions_not_attempted,
           correct_answers: data.correct_answers,
           incorrect_answers: data.incorrect_answers,
           total_marks: totalMarks,
           max_marks: maxMarks,
           percentage: percentage,
           nonnegative_percentage: nonnegativePercentage
         },
         answer_order: data.user_inputs
       };
       this.history.push(partialHistory);
       localStorage.setItem("quizHistory", JSON.stringify(this.history));
     }
   
     autoSaveSession() {
       const sessionData = {
         questions_attempted: this.questions_attempted,
         questions_not_attempted: this.questions_not_attempted,
         correct_answers: this.correct_answers,
         incorrect_answers: this.incorrect_answers,
         user_inputs: this.user_inputs
       };
       localStorage.setItem("currentQuizSession", JSON.stringify(sessionData));
     }
   
     undo() {
       if (this.user_inputs.length === 0) return;
       let lastInput = this.user_inputs.pop();
       switch (lastInput) {
         case "+":
           this.correct_answers--;
           this.questions_attempted--;
           break;
         case "-":
           this.incorrect_answers--;
           this.questions_attempted--;
           break;
         case ".":
           this.questions_not_attempted--;
           break;
       }
       this.updateDisplay();
     }
   
     updateDisplay() {
       this.displayResults();
       this.updateAnswerMenu();
       this.autoSaveSession();
     }
   
     updateAnswerMenu() {
       let circlesContainer = document.getElementById("answerCircles");
       if (!circlesContainer) return;
       circlesContainer.innerHTML = "";
       let menuEl = document.getElementById("answerMenu");
       let viewAllBtn = document.getElementById("viewAllButton");
       if (!menuEl || !viewAllBtn) return;
   
       let menuWidth = menuEl.offsetWidth;
       let viewAllWidth = viewAllBtn.offsetWidth + 16;
       let circleWidth = 38;
       let maxCircles = Math.floor((menuWidth - viewAllWidth) / circleWidth);
       if (maxCircles < 0) maxCircles = 0;
   
       let total = this.user_inputs.length;
       let startIndex = total - maxCircles;
       if (startIndex < 0) startIndex = 0;
   
       for (let i = startIndex; i < total; i++) {
         let circle = document.createElement("div");
         switch (this.user_inputs[i]) {
           case "+":
             circle.style.backgroundColor = "var(--accent-green)";
             break;
           case "-":
             circle.style.backgroundColor = "var(--accent-red)";
             break;
           case ".":
             circle.style.backgroundColor = "var(--accent-yellow)";
             break;
         }
         circle.innerText = i + 1;
         circlesContainer.appendChild(circle);
       }
     }
   
     displayFullAnswerMenu() {
       let fullMenu = document.getElementById("fullAnswerMenu");
       let content = document.getElementById("fullAnswerContent");
       content.innerHTML = "";
       for (let i = 0; i < this.user_inputs.length; i++) {
         let circle = document.createElement("div");
         switch (this.user_inputs[i]) {
           case "+":
             circle.style.backgroundColor = "var(--accent-green)";
             break;
           case "-":
             circle.style.backgroundColor = "var(--accent-red)";
             break;
           case ".":
             circle.style.backgroundColor = "var(--accent-yellow)";
             break;
         }
         circle.innerText = i + 1;
         content.appendChild(circle);
       }
       fullMenu.classList.remove("hidden");
     }
   
     hideFullAnswerMenu() {
       document.getElementById("fullAnswerMenu").classList.add("hidden");
     }
   
     openFullscreen() {
       let elem = document.documentElement;
       if (elem.requestFullscreen) {
         elem.requestFullscreen();
       } else if (elem.webkitRequestFullscreen) {
         elem.webkitRequestFullscreen();
       }
     }
   
     closeFullscreen() {
       if (document.exitFullscreen) {
         document.exitFullscreen();
       }
     }
   
     goFullscreen() {
       if (document.fullscreenElement) {
         this.closeFullscreen();
       } else {
         this.openFullscreen();
       }
     }
   
     reset() {
       this.history.push({
         timestamp: new Date().toISOString(),
         results: {
           questions_attempted: this.questions_attempted,
           questions_not_attempted: this.questions_not_attempted,
           correct_answers: this.correct_answers,
           incorrect_answers: this.incorrect_answers,
           total_marks: this.calculateTotalMarks(),
           max_marks: this.calculateMaxMarks(),
           percentage: this.calculatePercentage(),
           nonnegative_percentage: this.calculateNonnegativePercentage(),
         },
         answer_order: [...this.user_inputs]
       });
       localStorage.setItem("quizHistory", JSON.stringify(this.history));
   
       this.questions_attempted = 0;
       this.questions_not_attempted = 0;
       this.correct_answers = 0;
       this.incorrect_answers = 0;
       this.user_inputs = [];
   
       localStorage.removeItem("currentQuizSession");
       this.updateDisplay();
     }
   
     display_history() {
       if (!this.history.length) {
         alert("No quiz history found.");
         return;
       }
       let tbody = document.getElementById("historyTbody");
       if (!tbody) return;
       tbody.innerHTML = "";
       // Create table rows with a custom checkbox on the left.
       this.history.forEach((entry, index) => {
         let dateStr = new Date(entry.timestamp).toLocaleString();
         let r = entry.results;
         let row = document.createElement("tr");
         row.innerHTML = `
           <td>
             <div class="content">
               <label class="checkBox">
                 <input type="checkbox" class="history-select" value="${index}">
                 <div class="transition"></div>
               </label>
             </div>
           </td>
           <td>${index + 1}</td>
           <td>${dateStr}</td>
           <td>${r.questions_attempted}</td>
           <td>${r.questions_not_attempted}</td>
           <td>${r.correct_answers}</td>
           <td>${r.incorrect_answers}</td>
           <td>${r.total_marks}</td>
           <td>${r.max_marks}</td>
           <td>${r.percentage.toFixed(2)}%</td>
           <td>${r.nonnegative_percentage.toFixed(2)}%</td>
           <td><button class="history-view-btn" onclick="quiz.displayHistoryEntryAnswers(${index})">View Answers</button></td>
         `;
         tbody.appendChild(row);
       });
       document.getElementById("historyMenu").classList.remove("hidden");
     }
   
     deleteSelectedHistoryEntries() {
       // Gather all selected checkboxes.
       let selectedCheckboxes = document.querySelectorAll(".history-select:checked");
       if (selectedCheckboxes.length === 0) {
         alert("Please select at least one quiz entry to delete.");
         return;
       }
       if (!confirm("Are you sure you want to delete the selected quiz entries?")) {
         return;
       }
       // Extract indices; sort in descending order to avoid index shifting.
       let indices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
       indices.sort((a, b) => b - a);
       indices.forEach(i => {
         this.history.splice(i, 1);
       });
       localStorage.setItem("quizHistory", JSON.stringify(this.history));
       this.display_history();
     }
   
     displayHistoryEntryAnswers(index) {
       let entry = this.history[index];
       let fullMenu = document.getElementById("fullAnswerMenu");
       let content = document.getElementById("fullAnswerContent");
       content.innerHTML = "";
       if (!entry.answer_order || entry.answer_order.length === 0) {
         content.innerHTML = "No answer history available for this quiz.";
       } else {
         entry.answer_order.forEach((answer, i) => {
           let circle = document.createElement("div");
           switch (answer) {
             case "+":
               circle.style.backgroundColor = "var(--accent-green)";
               break;
             case "-":
               circle.style.backgroundColor = "var(--accent-red)";
               break;
             case ".":
               circle.style.backgroundColor = "var(--accent-yellow)";
               break;
           }
           circle.innerText = i + 1;
           content.appendChild(circle);
         });
       }
       fullMenu.classList.remove("hidden");
     }
   
     calculatePositiveMarks() {
       return this.correct_answers * this.correct_answer_value;
     }
   
     calculateNegativeMarks() {
       return this.incorrect_answers * this.incorrect_answer_value;
     }
   
     calculateTotalMarks() {
       return this.calculatePositiveMarks() + this.calculateNegativeMarks();
     }
   
     calculateMaxMarks() {
       return (
         (this.questions_attempted + this.questions_not_attempted) *
         this.correct_answer_value
       );
     }
   
     calculatePercentage() {
       let max = this.calculateMaxMarks();
       return max ? (this.calculateTotalMarks() / max) * 100 : 0;
     }
   
     calculateNonnegativePercentage() {
       let max = this.calculateMaxMarks();
       return max ? (this.calculatePositiveMarks() / max) * 100 : 0;
     }
   
     displayResults() {
       let total_marks = this.calculateTotalMarks();
       let max_marks = this.calculateMaxMarks();
       let percentage = this.calculatePercentage();
       let nonnegative_percentage = this.calculateNonnegativePercentage();
       document.getElementById("results").innerHTML = `
         <table class="results-table">
           <tr>
             <th colspan="2">Quiz Results</th>
           </tr>
           <tr>
             <td>Questions Attempted:</td>
             <td>${this.questions_attempted}</td>
           </tr>
           <tr>
             <td>Not Attempted:</td>
             <td>${this.questions_not_attempted}</td>
           </tr>
           <tr>
             <td>Correct Answers:</td>
             <td>${this.correct_answers}</td>
           </tr>
           <tr>
             <td>Incorrect Answers:</td>
             <td>${this.incorrect_answers}</td>
           </tr>
           <tr>
             <td>Positive Marks:</td>
             <td>${this.calculatePositiveMarks()}</td>
           </tr>
           <tr>
             <td>Negative Marks:</td>
             <td>${this.calculateNegativeMarks()}</td>
           </tr>
           <tr>
             <td>Total Marks:</td>
             <td>${total_marks} / ${max_marks}</td>
           </tr>
           <tr>
             <td>Percentage:</td>
             <td>${percentage.toFixed(2)}%</td>
           </tr>
           <tr>
             <th colspan="2">If No Negative Marking</th>
           </tr>
           <tr>
             <td>Total:</td>
             <td>${this.calculatePositiveMarks()} / ${max_marks}</td>
           </tr>
           <tr>
             <td>Nonnegative Percentage:</td>
             <td>${nonnegative_percentage.toFixed(2)}%</td>
           </tr>
         </table>
       `;
     }
   
     update_correct_answers() {
       this.correct_answers++;
       this.questions_attempted++;
       this.user_inputs.push("+");
       this.updateDisplay();
     }
   
     update_incorrect_answers() {
       this.incorrect_answers++;
       this.questions_attempted++;
       this.user_inputs.push("-");
       this.updateDisplay();
     }
   
     update_not_attempted() {
       this.questions_not_attempted++;
       this.user_inputs.push(".");
       this.updateDisplay();
     }
   }
   
   // Create quiz instance
   let quiz = new QuizTracker();
   
   // Add event listener for "Delete Selected" button in history modal.
   document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
     quiz.deleteSelectedHistoryEntries();
   });
   
   /* ==============================
      VALUE TILES + MODALS
      ============================== */
   function updateValueTiles() {
     document.getElementById("correctValueTile").textContent = `+${quiz.correct_answer_value}`;
     document.getElementById("incorrectValueTile").textContent = `${quiz.incorrect_answer_value}`;
   }
   
   function openValueChangeDialog(type) {
     const modal = document.getElementById("valueChangeModal");
     const label = document.getElementById("valueChangeLabel");
     const input = document.getElementById("valueChangeInput");
     if (type === "correct") {
       label.innerText = "Change Correct Answer Value:";
       input.value = quiz.correct_answer_value;
     } else {
       label.innerText = "Change Incorrect Answer Value:";
       input.value = quiz.incorrect_answer_value;
     }
     modal.classList.remove("hidden");
     document.getElementById("saveValueChange").onclick = () => {
       const newVal = Number(input.value);
       if (type === "correct") {
         quiz.correct_answer_value = newVal;
         localStorage.setItem("correct_answer_value", newVal);
       } else {
         quiz.incorrect_answer_value = newVal;
         localStorage.setItem("incorrect_answer_value", newVal);
       }
       quiz.updateDisplay();
       updateValueTiles();
       modal.classList.add("hidden");
     };
     document.getElementById("cancelValueChange").onclick = () => {
       modal.classList.add("hidden");
     };
   }
   document.getElementById("correctValueTile").addEventListener("click", () => {
     openValueChangeDialog("correct");
   });
   document.getElementById("incorrectValueTile").addEventListener("click", () => {
     openValueChangeDialog("incorrect");
   });
   updateValueTiles();
   
   /* ==============================
      HOOK UP BUTTONS
      ============================== */
   function updateCorrectAnswers() {
     quiz.update_correct_answers();
     if (!document.getElementById("fullAnswerMenu").classList.contains("hidden")) {
       quiz.displayFullAnswerMenu();
     }
   }
   
   function updateIncorrectAnswers() {
     quiz.update_incorrect_answers();
     if (!document.getElementById("fullAnswerMenu").classList.contains("hidden")) {
       quiz.displayFullAnswerMenu();
     }
   }
   
   function updateNotAttempted() {
     quiz.update_not_attempted();
     if (!document.getElementById("fullAnswerMenu").classList.contains("hidden")) {
       quiz.displayFullAnswerMenu();
     }
   }
   
   document.getElementById("undoButton").addEventListener("click", () => {
     quiz.undo();
   });
   
   document.getElementById("answerMenuButton").addEventListener("click", () => {
     let canal = document.getElementById("ansCanal");
     canal.classList.toggle("hidden");
     if (!canal.classList.contains("hidden")) {
       quiz.updateAnswerMenu();
     }
   });
   
   document.getElementById("fullScreen").addEventListener("click", () => {
     quiz.goFullscreen();
   });
   
   document.getElementById("historyButton").addEventListener("click", () => {
     quiz.display_history();
   });
   
   document.getElementById("resetButton").addEventListener("click", () => {
     quiz.reset();
   });
   
   document.getElementById("settingsButton").addEventListener("click", () => {
     document.getElementById("settingsMenu").classList.toggle("hidden");
   });
   
   document.getElementById("closeFullAnswer").addEventListener("click", () => {
     quiz.hideFullAnswerMenu();
   });
   
   document.getElementById("saveSettings").addEventListener("click", () => {
     let correctValue = document.getElementById("correctAnsBox").value;
     let incorrectValue = document.getElementById("incorrectAnsBox").value;
     if (correctValue !== "") {
       quiz.correct_answer_value = Number(correctValue);
       localStorage.setItem("correct_answer_value", correctValue);
     }
     if (incorrectValue !== "") {
       quiz.incorrect_answer_value = Number(incorrectValue);
       localStorage.setItem("incorrect_answer_value", incorrectValue);
     }
     document.getElementById("settingsMenu").classList.add("hidden");
     quiz.updateDisplay();
     updateValueTiles();
   });
   
   document.getElementById("closeHistory").addEventListener("click", () => {
     document.getElementById("historyMenu").classList.add("hidden");
   });
   
   window.addEventListener("keydown", function (event) {
     if (event.target.tagName.toLowerCase() === "input") return;
     switch (event.key) {
       case "+":
         updateCorrectAnswers();
         break;
       case "-":
         updateIncorrectAnswers();
         break;
       case "Enter":
         updateNotAttempted();
         break;
     }
   });
   
   /* ==============================
      DARK MODE TOGGLE (for whole website)
      ============================== */
   const themeToggleBtn = document.getElementById("themeToggle");
   if (themeToggleBtn) {
     const savedTheme = localStorage.getItem("theme");
     if (savedTheme === "dark") {
       document.body.classList.add("dark-mode");
     }
     themeToggleBtn.addEventListener("click", () => {
       document.body.classList.toggle("dark-mode");
       if (document.body.classList.contains("dark-mode")) {
         localStorage.setItem("theme", "dark");
       } else {
         localStorage.setItem("theme", "light");
       }
       // This toggle does not affect the share image theme.
     });
   }
   
   /* ==============================
      SHARE FEATURE IMPLEMENTATION
      ============================== */
   
   // Global variable for share image theme (separate from main site)
   let shareIsDark = localStorage.getItem("shareTheme") === "dark";
   let currentShareDataURL = "";
   
   // Helper: capture the #shareableSection as a PNG using an optional forced theme
   async function captureShareImage(isDarkMode = false) {
     const shareSection = document.getElementById("shareableSection");
     
     // Remove any previous forced theme classes.
     shareSection.classList.remove("share-dark", "force-light");
     if (isDarkMode) {
       shareSection.classList.add("share-dark");
     } else {
       shareSection.classList.add("force-light");
     }
   
     // Replicate header and results markup.
     const correctVal = quiz.correct_answer_value;
     const incorrectVal = quiz.incorrect_answer_value;
     const exportHeaderHTML = `
       <div class="header">
         <div class="title" style="margin-left: 10px;">Quiz Tracker</div>
         <div class="header-right">
           <div class="value-tiles">
             <div class="value-tile correct">+${correctVal}</div>
             <div class="value-tile incorrect">${incorrectVal}</div>
           </div>
         </div>
       </div>
     `;
     const resultsHTML = document.getElementById("results").outerHTML;
   
     shareSection.innerHTML = exportHeaderHTML + resultsHTML;
     shareSection.classList.remove("hidden");
     // Force width offscreen so it does not affect layout.
     shareSection.style.width = "600px";
   
     const canvas = await html2canvas(shareSection, { scale: 2 });
     const dataURL = canvas.toDataURL("image/png");
   
     // Cleanup: hide section, reset width and remove forced classes.
     shareSection.classList.add("hidden");
     shareSection.style.width = "";
     shareSection.classList.remove("share-dark", "force-light");
     return dataURL;
   }
   
   // 1) Show the share modal with the captured image.
   // Set the share toggle based on shareIsDark.
   document.getElementById("shareButton").addEventListener("click", async () => {
     const shareToggle = document.getElementById("toggleShareThemeSwitch");
     shareToggle.checked = shareIsDark;
     currentShareDataURL = await captureShareImage(shareIsDark);
     document.getElementById("sharePreview").src = currentShareDataURL;
     document.getElementById("shareModal").classList.remove("hidden");
   });
   
   // 2) Toggle the share image theme using the neumorphic toggle switch.
   // This only affects the share image.
   const toggleSwitch = document.getElementById("toggleShareThemeSwitch");
   toggleSwitch.addEventListener("change", async () => {
     shareIsDark = toggleSwitch.checked;
     localStorage.setItem("shareTheme", shareIsDark ? "dark" : "light");
     currentShareDataURL = await captureShareImage(shareIsDark);
     document.getElementById("sharePreview").src = currentShareDataURL;
   });
   
   // 3) Native share button
   document.getElementById("nativeShareBtn").addEventListener("click", async () => {
     if (!navigator.canShare || !navigator.canShare({ files: [] })) {
       alert("Sorry, your browser doesn't support the Web Share API for images.");
       return;
     }
     try {
       const res = await fetch(currentShareDataURL);
       const blob = await res.blob();
       const file = new File([blob], "quiz-share.png", { type: "image/png" });
       await navigator.share({
         text: "Check out my Quiz Tracker results!",
         files: [file]
       });
     } catch (err) {
       console.error("Sharing failed:", err);
     }
   });
   
   // 4) Download button
   document.getElementById("downloadShareBtn").addEventListener("click", () => {
     if (!currentShareDataURL) return;
     const link = document.createElement("a");
     link.download = "quiz-share.png";
     link.href = currentShareDataURL;
     link.click();
   });
   
   // 5) Close the share modal
   document.getElementById("closeShareModal").addEventListener("click", () => {
     document.getElementById("shareModal").classList.add("hidden");
   });
