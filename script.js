const API = "https://smart-fridge-backend-8eqn.onrender.com/api";
const USER_ID = "69ec3da07a68f3b4db0a183f";

// 🔧 DEBUG - Check Backend Status
async function checkBackendStatus() {
  const debugEl = document.getElementById("debugStatus");
  debugEl.innerHTML = "🔄 Checking...";
  
  try {
    // Check health endpoint
    const healthRes = await fetch(`${API}/health`);
    const healthData = await healthRes.json();
    
    debugEl.innerHTML = `
      ✅ Backend Status: ${healthData.status}<br>
      🗄️ MongoDB: ${healthData.mongoConnected ? '✅ Connected' : '❌ Disconnected'}<br>
      🌍 Environment: ${healthData.environment}
    `;
  } catch (error) {
    debugEl.innerHTML = "❌ Cannot reach backend: " + error.message;
    console.error("Backend check error:", error);
  }
}

// 🔧 DEBUG - Test API Connection
async function testAPIConnection() {
  const debugEl = document.getElementById("debugStatus");
  debugEl.innerHTML = "🔄 Testing API...";
  
  try {
    console.log("🌐 Testing:", `${API}/food`);
    const res = await fetch(`${API}/food`);
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
    
    if (res.ok) {
      debugEl.innerHTML = `✅ API connection OK! Found ${data.length || 0} foods in database`;
      if (data.length === 0) {
        debugEl.innerHTML += "<br>💡 Tip: No foods yet. Add food using the form above.";
      }
    } else {
      debugEl.innerHTML = "❌ API error: " + res.status;
    }
  } catch (error) {
    debugEl.innerHTML = "❌ API Error: " + error.message;
    console.error(error);
  }
}

// --- UI NAVIGATION LOGIC ---
function navTo(pageId, title, element) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target page
  document.getElementById(pageId).classList.add('active');

  // Update header title
  if (title) {
    document.getElementById('header-title').innerText = title;
  }

  // Update sidebar active state if an element was passed
  if (element) {
    document.querySelectorAll('.nav-item').forEach(nav => {
      nav.classList.remove('active');
    });
    element.classList.add('active');
  }
}

// Expose navTo globally so inline onclick handlers can call it from module script
window.navTo = navTo;

// --- ALERTS MODAL LOGIC ---
function openAlerts() {
  document.getElementById('alerts-modal').classList.add('show');
  getAlerts();
}

function closeAlerts() {
  document.getElementById('alerts-modal').classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('alerts-modal');
  if (event.target == modal) {
    closeAlerts();
  }
}

// ➕ ADD FOOD
async function addFood() {
  const name = document.getElementById("name").value;
  const quantity = document.getElementById("quantity").value;
  const purchaseDate = document.getElementById("date").value;

  if (!name || !quantity || !purchaseDate) {
    alert("Please fill all fields");
    return;
  }

  try {
    console.log("📤 Sending food data:", { name, quantity, purchaseDate, userId: USER_ID });
    
    const res = await fetch(`${API}/food/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        quantity: parseInt(quantity),
        purchaseDate,
        userId: USER_ID
      })
    });

    console.log("📥 Response status:", res.status);
    const data = await res.json();
    console.log("📥 Response data:", data);

    if (res.ok) {
      alert("✅ Food added successfully!");
      document.getElementById("name").value = "";
      document.getElementById("quantity").value = "";
      document.getElementById("date").value = "";
      getFoods(); // refresh
    } else {
      alert("❌ Error: " + (data.error || "Unknown error"));
      console.error("Server error details:", data);
    }

  } catch (error) {
    console.error("❌ Network error:", error);
    alert("❌ Failed to add food: " + error.message);
  }
}


// 📋 GET FOODS (UPDATED WITH EAT BUTTON)
async function getFoods() {
  console.log("📋 getFoods clicked");

  const list = document.getElementById("foodList");
  list.innerHTML = "<li>Loading...</li>";

  try {
    console.log("🌐 API URL:", `${API}/food`);
    const res = await fetch(`${API}/food`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("Response status:", res.status);
    console.log("Response headers:", res.headers);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Server error response:", errorText);
      throw new Error("Server error: " + res.status);
    }

    const data = await res.json();
    console.log("Data received:", data);
    console.log("Data length:", data ? data.length : 0);

    list.innerHTML = "";

    // Update Dashboard Stats
    if (document.getElementById('dash-total-items')) {
      document.getElementById('dash-total-items').innerText = data ? data.length : 0;
    }
    
    let expiringCount = 0;

    if (!data || data.length === 0) {
      list.innerHTML = "<li>No foods added yet</li>";
      if (document.getElementById('dash-expiring-soon')) {
         document.getElementById('dash-expiring-soon').innerText = "0";
      }
      return;
    }

    data.forEach(f => {
      const li = document.createElement("li");

      const calorieText = f.nutrition?.calories 
        ? ` - ${f.nutrition.calories} cal` 
        : "";

      const statusText = f.status 
        ? ` - ${f.status}` 
        : "";

      const isRotten = f.status && f.status.includes("ROTTEN");
      const isHighRisk = f.status && f.status.includes("HIGH");

      if (isHighRisk || isRotten) {
        expiringCount++;
      }

      let alertBadge = "";
      if (isRotten) {
        alertBadge = `<span style="color: var(--danger); font-weight: bold; font-size: 0.9em; padding: 4px 8px; background: rgba(239,68,68,0.1); border-radius: 4px;"> <i data-lucide="alert-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> WASTED (EXPIRED)</span>`;
      } else if (isHighRisk) {
        alertBadge = `<span style="color: var(--warning); font-weight: bold; font-size: 0.9em; padding: 4px 8px; background: rgba(245,158,11,0.1); border-radius: 4px;"> <i data-lucide="alert-triangle" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> EXPIRING SOON</span>`;
      }

      // If it's rotten, only allow wasting it. Otherwise, allow eating it.
      let actionButtons = "";
      if (isRotten) {
        actionButtons = `
          <input type="number" placeholder="Amt" id="amt-${f._id}" style="width: 60px;" value="${f.quantity}">
          <button onclick="wasteFood('${f._id}')" class="danger" style="padding: 8px 12px; font-size: 0.85em;"><i data-lucide="trash-2"></i> Discard</button>
        `;
      } else {
        actionButtons = `
          <input type="number" placeholder="Amt" id="amt-${f._id}" style="width: 60px;">
          <button onclick="consumeFood('${f._id}')" style="padding: 8px 12px; font-size: 0.85em;"><i data-lucide="check"></i> Eat</button>
        `;
      }

      li.innerHTML = `
        <div class="food-header">
          <div>
            <b style="font-size:1.2rem; color:var(--accent);">${f.name}</b> 
            <span style="color:var(--text-muted);">(Qty: ${f.quantity})</span>
          </div>
          <div>${alertBadge}</div>
        </div>
        <div style="font-size: 0.9em; margin-bottom: 10px;">
          ${statusText} ${calorieText}
        </div>
        <div class="food-actions">
          ${actionButtons}
        </div>
      `;

      list.appendChild(li);
    });

    if (document.getElementById('dash-expiring-soon')) {
      document.getElementById('dash-expiring-soon').innerText = expiringCount;
    }
    
    // Re-initialize icons for newly added elements
    if (window.lucide) {
      lucide.createIcons();
    }

  } catch (error) {
    console.error("❌ Error fetching foods:", error);
    list.innerHTML = `<li style="color:red;">Error: ${error.message}</li>`;
  }
}

// 🍽️ CONSUME FOOD (NO ID INPUT NEEDED)
async function consumeFood(foodId) {
  const amount = document.getElementById(`amt-${foodId}`).value;

  if (!amount || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  try {
    const res = await fetch(`${API}/food/consume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        foodId,
        quantityConsumed: parseInt(amount),
        userId: USER_ID
      })
    });

    const data = await res.json();
    alert(data.message);

    getFoods(); // refresh list
    getStats(); // refresh stats
    getGroceryList(); // refresh grocery list if needed
  } catch (error) {
    console.error("❌ Error consuming food:", error);
  }
}

// 🗑️ WASTE FOOD
async function wasteFood(foodId) {
  const amount = document.getElementById(`amt-${foodId}`).value;

  if (!amount || amount <= 0) {
    alert("❌ Enter valid amount");
    return;
  }

  try {
    const res = await fetch(`${API}/food/waste`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        foodId,
        quantityWasted: parseInt(amount),
        userId: USER_ID
      })
    });

    const data = await res.json();
    alert(data.message);

    getFoods(); // refresh list
    getStats(); // refresh stats
    getGroceryList(); // refresh grocery list if needed
  } catch (error) {
    console.error("❌ Error wasting food:", error);
  }
}

// 🌍 GET USER STATS & SUSTAINABILITY
async function getStats() {
  try {
    const res = await fetch(`${API}/auth/stats/${USER_ID}`);
    const data = await res.json();
    const statsContent = document.getElementById("statsContent");

    if (res.ok) {
      // Update Dashboard Stats
      if (document.getElementById('dash-waste-saved')) {
        document.getElementById('dash-waste-saved').innerText = data.foodSaved;
      }
      if (document.getElementById('dash-sustain-score')) {
        document.getElementById('dash-sustain-score').innerText = `${data.sustainabilityScore}/100`;
      }

      const colorClass = data.sustainabilityScore > 50 ? 'green' : 'red';
      statsContent.innerHTML = `
        <div class="stats-grid">
          <div class="stat-box">
            <h4>Food Saved</h4>
            <div class="val">${data.foodSaved}</div>
          </div>
          <div class="stat-box">
            <h4>Food Wasted</h4>
            <div class="val">${data.foodWasted}</div>
          </div>
          <div class="stat-box">
            <h4>Score</h4>
            <div class="val ${colorClass}">${data.sustainabilityScore}/100</div>
          </div>
        </div>
      `;
    } else {
      statsContent.innerHTML = `<p style="color:red">Failed to load stats.</p>`;
    }
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
  }
}

// 🔔 GET ALERTS
async function getAlerts() {
  try {
    const res = await fetch(`${API}/alerts/${USER_ID}`);
    const data = await res.json();
    const list = document.getElementById("alertsList");
    list.innerHTML = "";

    if (res.ok && data.notifications && data.notifications.length > 0) {
      document.getElementById("alert-badge").innerText = data.notifications.length;
      data.notifications.forEach(n => {
        const li = document.createElement("li");
        li.className = "alert-item";
        li.innerHTML = `<strong style="color:var(--warning)">${n.name}</strong> (Qty: ${n.quantity}) - ${n.status}`;
        list.appendChild(li);
      });
    } else {
      document.getElementById("alert-badge").innerText = "0";
      list.innerHTML = "<li>No expiring items!</li>";
    }
  } catch (error) {
    console.error("❌ Error fetching alerts:", error);
  }
}

// 🛒 GET GROCERY LIST
async function getGroceryList() {
  try {
    const res = await fetch(`${API}/grocery/${USER_ID}`);
    const data = await res.json();
    const list = document.getElementById("groceryList");
    list.innerHTML = "";

    if (res.ok && data.length > 0) {
      data.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
          <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
            <input type="checkbox" style="width:20px; height:20px;" ${item.isPurchased ? "checked" : ""} onchange="updateGroceryItem('${item._id}', this.checked)">
            <span style="font-size:1.1rem; text-decoration: ${item.isPurchased ? "line-through" : "none"}; color: ${item.isPurchased ? "var(--text-muted)" : "var(--text)"}">
              ${item.name} <span style="font-size:0.8em; color:var(--text-muted)">(Qty: ${item.quantity})</span>
            </span>
          </label>
        `;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li>Your grocery list is empty!</li>";
    }
  } catch (error) {
    console.error("❌ Error fetching grocery list:", error);
  }
}

async function updateGroceryItem(itemId, isPurchased) {
  try {
    await fetch(`${API}/grocery/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPurchased })
    });
    getGroceryList();
  } catch (error) {
    console.error("❌ Error updating grocery item:", error);
  }
}


// 🤖 GET SUGGESTION
async function getSuggestion() {
  const targetCalories = document.getElementById("cal").value;
  const targetProtein = document.getElementById("protein").value;
  const targetFat = document.getElementById("fat").value;

  if (!targetCalories) {
    alert("Please enter target calories");
    return;
  }

  const list = document.getElementById("suggestion");
  list.innerHTML = "<li><i data-lucide=\"loader\"></i> Calculating AI Meal Plan...</li>";

  try {
    console.log("📋 Fetching suggestion...");
    const res = await fetch(`${API}/goal/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetCalories: parseInt(targetCalories),
        targetProtein: parseInt(targetProtein) || 0,
        targetFat: parseInt(targetFat) || 0
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Server error: " + res.status);
    }

    console.log("Suggestion data:", data);
    list.innerHTML = "";

    if (!data.selectedFoods || data.selectedFoods.length === 0) {
      list.innerHTML = "<li>No foods match your goal yet.</li>";
      return;
    }

    data.selectedFoods.forEach(f => {
      const li = document.createElement("li");
      li.style.marginBottom = "8px";
      li.innerHTML = `Eat <strong>${f.recommendedQuantity}x</strong> ${f.name} <br>
      <span style="font-size:0.85em; color:gray;">(${f.calories} cal | ${f.protein}g protein | ${f.fat}g fat)</span>`;
      list.appendChild(li);
    });

    // Show totals
    const totalLi = document.createElement("li");
    totalLi.style.fontWeight = "bold";
    totalLi.style.color = "green";
    totalLi.innerText = `📊 Total: ${data.total.calories} cal | ${data.total.protein}g protein | ${data.total.fat}g fat`;
    list.appendChild(totalLi);

  } catch (error) {
    console.error("❌ Error fetching suggestion:", error);
    document.getElementById("suggestion").innerHTML = `<li style='color:red;'>Error: ${error.message}</li>`;
  }
}


// 🧑‍🍳 GET AI CHEF RECIPES
async function getRecipes() {
  try {
    const div = document.getElementById("recipes");
    div.innerHTML = "<p><i data-lucide=\"loader\"></i> AI Chef is crafting your personalized recipes...</p>";

    console.log("Fetching AI recipes...");
    const res = await fetch(`${API}/recipes/suggest?userId=${USER_ID}`);

    if (!res.ok) {
      throw new Error("Server error: " + res.status);
    }

    const data = await res.json();
    console.log("AI Recipes data:", data);

    div.innerHTML = "";

    if (!data.recipes || data.recipes.length === 0) {
      div.innerHTML = "<p style='color: var(--warning);'><i data-lucide=\"info\"></i> Add some food to your fridge first!</p>";
      return;
    }

    // Show AI recipes
    data.recipes.forEach(r => {
      const el = document.createElement("div");
      el.className = "recipe-card";

      const ingList = r.ingredients ? r.ingredients.map(i => `<li>${i}</li>`).join("") : "None specified";

      el.innerHTML = `
        <h3>${r.title}</h3>
        <p class="desc">${r.description || ""}</p>
        <h4 style="margin-bottom: 8px; color: var(--text-main);">🥘 Ingredients from your fridge:</h4>
        <ul style="margin-top: 0; margin-bottom: 16px;">${ingList}</ul>
        <h4 style="margin-bottom: 8px; color: var(--text-main);">📜 Instructions:</h4>
        <p style="white-space: pre-line; font-size: 0.95em; color: var(--text-muted);">${r.instructions || "Just mix everything and enjoy!"}</p>
      `;
      div.appendChild(el);
    });

  } catch (error) {
    console.error("❌ Error fetching recipes:", error);
    document.getElementById("recipes").innerHTML = `<p style='color:red;'>Error: ${error.message}</p>`;
  }
}

// 📸 SCAN FRIDGE IMAGE (VISION AI)
async function scanFridgeImage() {
  const fileInput = document.getElementById("fridgeImage");
  const list = document.getElementById("scannedItemsList");
  
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("Please select an image first!");
    return;
  }

  list.innerHTML = "<li><i data-lucide=\"loader\"></i> Scanning fridge... please wait.</li>";

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  try {
    const res = await fetch(`${API}/vision/scan`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    list.innerHTML = "";
    if (res.ok && data.items && data.items.length > 0) {
      list.innerHTML = "<li style='color:var(--success); font-weight:bold;'><i data-lucide=\"check-circle\"></i> Identified Items:</li>";
      data.items.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${item} 
          <button onclick="navTo('page-fridge', 'Food Inventory', document.querySelectorAll('.nav-item')[1]); document.getElementById('name').value='${item}'; window.scrollTo(0, 0);" style="padding: 6px 12px; font-size: 0.85em; margin-left: auto;" class="secondary">Quick Add</button>
        `;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li><i data-lucide=\"x-circle\"></i> Could not identify any foods clearly.</li>";
    }

  } catch (error) {
    console.error("Vision Error:", error);
    list.innerHTML = `<li style="color:red;">Error: ${error.message}</li>`;
  }
}


// 🔄 AUTO LOAD FOODS WHEN PAGE OPENS
window.onload = () => {
  getFoods();
  getStats();
  getAlerts();
  getGroceryList();
  
  if (window.lucide) {
    lucide.createIcons();
  }
};