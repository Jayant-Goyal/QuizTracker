/* ==============================
   TIMER & GLOBAL VARS
   ============================== */
   let timerInterval;
   let isTimerRunning = false;
   let startTime, pausedTime = 0;
   
   function updateStopwatch() {
     // If running, calculate elapsed from current time; if paused, show the accumulated time.
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
       this.questions_attempted = 0;
       this.questions_not_attempted = 0;
       this.correct_answers = 0;
       this.incorrect_answers = 0;
       this.user_inputs = [];
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
   
     aFullscreen() {
       if (!document.fullscreenElement) {
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
       });
       localStorage.setItem("quizHistory", JSON.stringify(this.history));
       this.questions_attempted = 0;
       this.questions_not_attempted = 0;
       this.correct_answers = 0;
       this.incorrect_answers = 0;
       this.user_inputs = [];
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
       this.history.forEach((entry, index) => {
         let dateStr = new Date(entry.timestamp).toLocaleString();
         let r = entry.results;
         let row = document.createElement("tr");
         row.innerHTML = `
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
         `;
         tbody.appendChild(row);
       });
       document.getElementById("historyMenu").classList.remove("hidden");
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
   
   // Undo button
   document.getElementById("undoButton").addEventListener("click", () => {
     quiz.undo();
   });
   
   // The "Answer Canal" toggle
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
   
   // Keyboard shortcuts – ignore if focus on input
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
      DARK MODE TOGGLE (optional)
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
     });
   }
   