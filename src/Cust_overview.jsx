import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Cust_overview.css";

const CustomerOverview = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [plans, setPlans] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await Promise.all([fetchActivePlans(), fetchActiveSubscription()]);
      setIsLoading(false);
    };
    
    if (token) {
      initializeData();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const fetchActiveSubscription = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8081/api/subscriptions/user/${userId}/active`
      );
      console.log("Subscription response:", response.data);
      setActiveSubscription(response.data);
    } catch (error) {
      console.error("Error fetching active subscription:", error);
      setActiveSubscription(null);
    }
  };

  const fetchActivePlans = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/plans/active");
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    setActiveTab("Plan Details");
  };

  const subscribePlan = async () => {
    if (!selectedPlan || !token) {
      alert("Please login to continue");
      return;
    }
    
    setIsSubscribing(true);
    
    try {
      const response = await axios.post("http://localhost:8081/api/subscriptions", {
        userId: parseInt(userId),
        planId: selectedPlan.id,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      alert("Subscribed successfully!");
      setSelectedPlan(null);
      setActiveTab("Overview");
      await fetchActiveSubscription();
      
    } catch (error) {
      console.error("Subscription failed:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        alert("Your session has expired. Please login again.");
        window.location.href = '/login';
      } else {
        alert("Failed to subscribe: " + (error.response?.data?.message || "Please try again"));
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleQuickAction = (tab) => {
    setActiveTab(tab);
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getDataRemaining = () => {
    if (!activeSubscription) return "N/A";
    
    if (activeSubscription.dataLeft !== undefined && activeSubscription.dataLeft !== null) {
      return activeSubscription.dataLeft + " GB";
    }
    
    if (activeSubscription.dataUsed !== undefined && activeSubscription.dataUsed !== null) {
      const planData = getPlanData();
      if (planData) {
        const remaining = planData.dataLimitGB - activeSubscription.dataUsed;
        return remaining > 0 ? remaining + " GB" : "0 GB";
      }
    }
    
    const planData = getPlanData();
    if (planData) {
      return planData.dataLimitGB + " GB";
    }
    
    return "N/A";
  };

  const getPlanData = () => {
    if (!activeSubscription) return null;
    
    if (activeSubscription.plan && activeSubscription.plan.dataLimitGB) {
      return activeSubscription.plan;
    }
    
    if (activeSubscription.planId && plans.length > 0) {
      const plan = plans.find(p => p.id === activeSubscription.planId);
      if (plan) return plan;
    }
    
    if (activeSubscription.planName && plans.length > 0) {
      const plan = plans.find(p => p.name === activeSubscription.planName);
      if (plan) return plan;
    }
    
    if (activeSubscription.dataLimitGB) {
      return activeSubscription;
    }
    
    return null;
  };

  const getPlanName = () => {
    if (!activeSubscription) return "No Active Plan";
    
    if (activeSubscription.planName) return activeSubscription.planName;
    if (activeSubscription.plan?.name) return activeSubscription.plan.name;
    
    const planData = getPlanData();
    if (planData?.name) return planData.name;
    
    return "Active Plan";
  };

  if (!token) {
    return (
      <div className="auth-error">
        <h2>Authentication Required</h2>
        <p>Please login to access this page</p>
        <button onClick={() => window.location.href = '/login'}>
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your account information...</p>
      </div>
    );
  }

  return (
    <div className="customer-container">
      {/* Toolbar */}
      <header className="toolbar">
        <div className="toolbar-left">
          <div className="phone-logo">📱</div>
          <h1 className="toolbar-title">SkyLink Customer</h1>
        </div>
        <button 
          className="logout-btn"
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
        >
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="tab-bar">
        <div className="tab-container">
          {["Overview", "Choose Plan", "Complaints", "Help & FAQ"].map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Overview Boxes */}
      {activeTab === "Overview" && (
        <>
          <div className="analytics-boxes">
            <div className="analytics-box">
              <div className="analytics-value">
                {getPlanName()}
              </div>
              <div className="analytics-label">Current Plan</div>
            </div>
            <div className="analytics-box">
              <div className="analytics-value">
                {activeSubscription ? calculateDaysLeft(activeSubscription.endDate) + " days" : "N/A"}
              </div>
              <div className="analytics-label">Days Left</div>
            </div>
            <div className="analytics-box">
              <div className="analytics-value">
                {getDataRemaining()}
              </div>
              <div className="analytics-label">Data Remaining</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button onClick={() => handleQuickAction("Choose Plan")}>
                {activeSubscription ? "Change Plan" : "Choose Plan"}
              </button>
              <button onClick={() => handleQuickAction("Complaints")}>
                Raise Complaint
              </button>
              <button onClick={() => handleQuickAction("Help & FAQ")}>
                Get Help
              </button>
            </div>
          </div>
        </>
      )}

      {/* Choose Plan Tab */}
      {activeTab === "Choose Plan" && (
        <ChoosePlan 
          plans={plans} 
          onPlanSelect={handlePlanSelection}
          activeSubscription={activeSubscription}
        />
      )}

      {/* Plan Details Tab */}
      {activeTab === "Plan Details" && selectedPlan && (
        <PlanDetails 
          plan={selectedPlan}
          onSubscribe={subscribePlan}
          onBack={() => setActiveTab("Choose Plan")}
          isSubscribing={isSubscribing}
        />
      )}

      {/* Other Tabs */}
      {activeTab !== "Overview" && activeTab !== "Choose Plan" && activeTab !== "Plan Details" && (
        <div className="tab-body">
          {activeTab === "Complaints" && <Complaints />}
          {activeTab === "Help & FAQ" && <Help />}
        </div>
      )}
    </div>
  );
};

// ChoosePlan Component
const ChoosePlan = ({ plans, onPlanSelect, activeSubscription }) => {
  return (
    <div className="plans-container">
      <h2 className="tab-header">Choose a Plan</h2>
      {activeSubscription && (
        <div className="current-plan-banner">
          <h4>Your Current Plan: {activeSubscription.planName || activeSubscription.plan?.name}</h4>
          <p>Valid until: {new Date(activeSubscription.endDate).toLocaleDateString()}</p>
        </div>
      )}
      <div className="plans-grid">
        {plans.length === 0 ? (
          <div className="loading">Loading plans...</div>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="plan-card">
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price">₹{plan.price}</span>
                  <span className="duration">/month</span>
                </div>
              </div>
              
              <div className="plan-description">
                <p>{plan.description}</p>
              </div>
              
              <div className="plan-features">
                <div className="feature highlight">
                  <span className="feature-icon">📶</span>
                  <span className="feature-text">{plan.dataLimitGB} GB Data</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">⚡</span>
                  <span className="feature-text">{plan.speedMbps} Mbps Speed</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📅</span>
                  <span className="feature-text">{plan.durationInDays} Days Validity</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">📞</span>
                  <span className="feature-text">Unlimited Calls</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">💬</span>
                  <span className="feature-text">100 SMS/day</span>
                </div>
              </div>
              
              <button 
                className="select-plan-btn"
                onClick={() => onPlanSelect(plan)}
              >
                Select Plan
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// PlanDetails Component
const PlanDetails = ({ plan, onSubscribe, onBack, isSubscribing }) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + plan.durationInDays);

  return (
    <div className="plan-details-container">
      <button className="back-btn" onClick={onBack}>← Back to Plans</button>
      
      <div className="plan-details-card">
        <div className="plan-details-header">
          <h2>{plan.name}</h2>
          <div className="plan-details-price">
            <span className="price">₹{plan.price}</span>
            <span className="duration">for {plan.durationInDays} days</span>
          </div>
        </div>
        
        <div className="plan-details-content">
          <div className="plan-details-section">
            <h3>Description</h3>
            <p>{plan.description}</p>
          </div>
          
          <div className="plan-details-section">
            <h3>Features</h3>
            <div className="features-list">
              <div className="feature-item highlight">
                <span className="feature-icon">📶</span>
                <span className="feature-text">
                  <strong>{plan.dataLimitGB} GB</strong> High-speed data
                </span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">{plan.speedMbps} Mbps Internet speed</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📞</span>
                <span className="feature-text">Unlimited calls</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span className="feature-text">100 SMS per day</span>
              </div>
            </div>
          </div>
          
          <div className="plan-details-section">
            <h3>Validity Period</h3>
            <div className="validity-dates">
              <div className="date-item">
                <span className="date-label">Start Date:</span>
                <span className="date-value">{startDate.toLocaleDateString()}</span>
              </div>
              <div className="date-item">
                <span className="date-label">End Date:</span>
                <span className="date-value">{endDate.toLocaleDateString()}</span>
              </div>
              <div className="date-item">
                <span className="date-label">Total Duration:</span>
                <span className="date-value">{plan.durationInDays} days</span>
              </div>
              <div className="date-item highlight">
                <span className="date-label">Total Data:</span>
                <span className="date-value">{plan.dataLimitGB} GB</span>
              </div>
            </div>
          </div>
        </div>
        
        <button 
          className="subscribe-btn-large" 
          onClick={onSubscribe}
          disabled={isSubscribing}
        >
          {isSubscribing ? 'Subscribing...' : `Confirm Subscription - ₹${plan.price}`}
        </button>
      </div>
    </div>
  );
};

// Complaints Component (✅ Added fully functional)
const Complaints = () => {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token && userId) {
      fetchComplaints();
    }
  }, [token, userId]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8081/api/complaints/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Please enter both subject and description.");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:8081/api/complaints",
        {
          userId: parseInt(userId),
          subject,
          description,
          priority: "MEDIUM",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("Complaint submitted successfully! ID: " + response.data.id);
      setSubject("");
      setDescription("");
      fetchComplaints();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      alert("Failed to submit complaint.");
    }
  };

  return (
    <div className="tab-content">
      <h2>⚠️ Raise & Track Complaints</h2>

      {/* Complaint Form */}
      <form className="complaint-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Complaint Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <textarea
          placeholder="Describe your issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <button type="submit">Submit Complaint</button>
      </form>

      {/* Complaint History */}
      <h3>Your Complaints</h3>
      {loading ? (
        <p>Loading complaints...</p>
      ) : complaints.length === 0 ? (
        <p>No complaints found.</p>
      ) : (
        <ul className="complaints-list">
          {complaints.map((c) => (
            <li key={c.id} className="complaint-item">
              <strong>ID #{c.id}</strong> — {c.subject}
              <br />
              <small>Status: {c.status}</small>
              <p>{c.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

//const Help = () => <h2 className="tab-content">❓ Help & FAQ</h2>;

const Help = () => (
  <div className="help-container">
    <div className="help-header">
      <h2>Help & Frequently Asked Questions</h2>
      <p>Find answers to common questions about our services and plans</p>
    </div>

    <div className="help-content">
      {/* Plans & Subscription FAQs */}
      <div className="faq-section">
        <h3>📋 Plans & Subscription</h3>
        <div className="faq-item">
          <h4>What types of plans do you offer?</h4>
          <p>We offer four main plans: Basic Plan (₹199), Standard Plan (₹299), Premium Plus Plan (₹499), and Enterprise Plan (₹699). Each plan varies in data limits, speed, and features.</p>
        </div>
        <div className="faq-item">
          <h4>How do I subscribe to a plan?</h4>
          <p>Go to the "Choose Plan" tab, select your desired plan, review the details, and click "Confirm Subscription". Your plan will be activated immediately.</p>
        </div>
        <div className="faq-item">
          <h4>Can I change my plan during the billing cycle?</h4>
          <p>Yes, you can upgrade your plan at any time. The new plan will be effective immediately, and you'll be charged a pro-rated amount for the remaining days.</p>
        </div>
        <div className="faq-item">
          <h4>What happens when my data limit is reached?</h4>
          <p>Once you reach your data limit, your internet speed may be reduced to basic speeds (typically 64kbps) for browsing essential services until your next billing cycle.</p>
        </div>
        <div className="faq-item">
          <h4>Are there any hidden charges?</h4>
          <p>No, all our plans have transparent pricing. The displayed price includes all taxes and fees. Additional charges only apply for international roaming or premium services.</p>
        </div>
      </div>

      {/* Network & Connectivity FAQs */}
      <div className="faq-section">
        <h3>📶 Network & Connectivity</h3>
        <div className="faq-item">
          <h4>What network technology do you use?</h4>
          <p>We provide 4G LTE and 5G network connectivity depending on your device compatibility and location coverage.</p>
        </div>
        <div className="faq-item">
          <h4>What is your network coverage area?</h4>
          <p>We cover all major cities and towns across India. Check our coverage map on our website for specific area availability.</p>
        </div>
        <div className="faq-item">
          <h4>Why is my internet speed slow?</h4>
          <p>Slow speeds can be due to network congestion, signal strength, or reaching your data limit. Try moving to an open area or restarting your device.</p>
        </div>
        <div className="faq-item">
          <h4>Do you support international roaming?</h4>
          <p>Yes, our Enterprise Plan includes international roaming. Other plans can activate roaming with additional packages.</p>
        </div>
      </div>

      {/* Technical Support FAQs */}
      <div className="faq-section">
        <h3>🔧 Technical Support</h3>
        <div className="faq-item">
          <h4>How do I configure APN settings?</h4>
          <p>APN settings are automatically configured for most devices. For manual setup, use: APN - "skylink.internet", no username/password required.</p>
        </div>
        <div className="faq-item">
          <h4>Why can't I make calls or send messages?</h4>
          <p>This could be due to network issues or account suspension. Check your balance and network signal, or contact support for assistance.</p>
        </div>
        <div className="faq-item">
          <h4>How do I check my data usage?</h4>
          <p>Your current data usage and remaining balance are displayed in the Overview tab. You can also view detailed usage history there.</p>
        </div>
        <div className="faq-item">
          <h4>What should I do if the app isn't working?</h4>
          <p>Try updating to the latest version, clearing app cache, or reinstalling the app. If issues persist, contact our technical support team.</p>
        </div>
      </div>

      {/* Emergency Support */}
      <div className="emergency-support">
        <div className="emergency-contacts">
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <div className="contact-info">
              <strong>24/7 Customer Support</strong>
              <p>+91-891-968-1985</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default CustomerOverview;
