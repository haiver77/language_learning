**Enhance the speech‑validation logic inside the Speaking Practice module with the following requirements:**

### **1. Flexible Word Matching (Non‑Strict Order)**  
The system must validate the user’s spoken phrase **against the entire target phrase**, but **without enforcing strict word order**.  
Instead of comparing words only by index, implement a matching algorithm that:

- Searches for each spoken word **anywhere ahead** in the target phrase.  
- When a match is found, the validator must **jump forward** and continue matching from that position.  
- Correctly spoken words must be marked **green**, incorrect ones **red**, even if the user slightly changes the order.

**Example:**  
- Target: `the house has three black doors`  
- Spoken: `house has three back doors`  
The validator must detect that “house” appears later in the phrase and continue matching from there, marking correct words green.

---

### **2. Handle Repeated Words Gracefully**  
Users often repeat words to improve pronunciation.  
The system must treat repeated spoken words as valid **as long as they exist in the target phrase**, even if they appear multiple times.

**Example:**  
- Target: `the house has three black doors`  
- Spoken: `the house the house has three back doors`  
All spoken words exist in the target phrase, therefore **all should be marked green**.

Repeated words must **not** cause the entire phrase to be marked incorrect.

---

### **3. Per‑Word Validation Instead of Whole‑Phrase Failure**  
The validator must operate **word by word**, never marking the entire phrase red unless **every** word is incorrect.  
Partial correctness must always be reflected visually.
