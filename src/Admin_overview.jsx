import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Admin_overview.css";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminOverview = () => {
  const [activeTab, setActiveTab] = useState("Overview");
  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalComplaints: 0,
    pendingIssues: 0,
  });

  const [recentUsers, setRecentUsers] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [planDistribution, setPlanDistribution] = useState({});
  const [complaintStatus, setComplaintStatus] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchAdminData();
    }
  }, [token]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      // Fetch all data in parallel
      await Promise.all([
        fetchAnalytics(),
        fetchRecentUsers(),
        fetchRecentComplaints(),
        fetchPlanDistribution(),
        fetchComplaintStatus()
      ]);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        alert("Your session has expired. Please login again.");
        window.location.href = '/login';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlanDistribution = async () => {
    try {
      const [usersResponse, subscriptionsResponse] = await Promise.all([
        axios.get("http://localhost:8081/api/users"),
        axios.get("http://localhost:8081/api/subscriptions")
      ]);
      
      const customers = usersResponse.data.filter(user => user.role === "CUSTOMER");
      const subscriptions = subscriptionsResponse.data;
      
      // Count customers per plan
      const distribution = {};
      customers.forEach(customer => {
        const activeSub = subscriptions.find(sub => 
          sub.userId === customer.id && sub.status === "ACTIVE"
        );
        const planName = activeSub ? `Plan ${activeSub.planId}` : "No Plan";
        distribution[planName] = (distribution[planName] || 0) + 1;
      });
      
      setPlanDistribution(distribution);
    } catch (error) {
      console.error("Error fetching plan distribution:", error);
    }
  };

  const fetchComplaintStatus = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/complaints");
      const complaints = response.data;
      
      const statusCount = {
        pending: 0,
        resolved: 0
      };
      
      complaints.forEach(complaint => {
        if (complaint.status === "OPEN" || complaint.status === "IN_PROGRESS") {
          statusCount.pending++;
        } else if (complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
          statusCount.resolved++;
        }
      });
      
      setComplaintStatus(statusCount);
    } catch (error) {
      console.error("Error fetching complaint status:", error);
    }
  };
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import "./Admin_overview.css";

// const AdminOverview = () => {
//   const [activeTab, setActiveTab] = useState("Overview");
//   const [analytics, setAnalytics] = useState({
//     totalCustomers: 0,
//     activeCustomers: 0,
//     totalComplaints: 0,
//     pendingIssues: 0,
//   });

//   const [recentUsers, setRecentUsers] = useState([]);
//   const [recentComplaints, setRecentComplaints] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const token = localStorage.getItem('token');

//   useEffect(() => {
//     if (token) {
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       fetchAdminData();
//     }
//   }, [token]);

//   const fetchAdminData = async () => {
//     setIsLoading(true);
//     try {
//       // Fetch all data in parallel
//       await Promise.all([
//         fetchAnalytics(),
//         fetchRecentUsers(),
//         fetchRecentComplaints()
//       ]);
//     } catch (error) {
//       console.error("Error fetching admin data:", error);
//       if (error.response?.status === 401 || error.response?.status === 403) {
//         localStorage.removeItem('token');
//         localStorage.removeItem('userRole');
//         alert("Your session has expired. Please login again.");
//         window.location.href = '/login';
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

  const fetchAnalytics = async () => {
    try {
      // Fetch all users, active subscriptions count, and complaints
      const [usersResponse, activeSubsResponse, complaintsResponse] = await Promise.all([
        axios.get("http://localhost:8081/api/users"),
        axios.get("http://localhost:8081/api/subscriptions/stats/active"),
        axios.get("http://localhost:8081/api/complaints")
      ]);
      
      const allUsers = usersResponse.data;
      const activeSubscriptionsCount = activeSubsResponse.data;
      const complaints = complaintsResponse.data;
      
      // Filter out admin users (assuming they have a role property)
      // If no role property, we'll assume customers have subscriptionPlan
      const customers = allUsers.filter(user => 
        (user.role !== "ADMIN" && user.role !== "ROLE_ADMIN") || 
        (user.subscriptionPlan && user.subscriptionPlan !== "NONE")
      );
      
      // Count pending issues
      const pendingIssuesCount = complaints.filter(complaint => 
        complaint.status === "OPEN" || complaint.status === "IN_PROGRESS"
      ).length;
      
      setAnalytics({
        totalCustomers: customers.length,
        activeCustomers: activeSubscriptionsCount,
        totalComplaints: complaints.length,
        pendingIssues: pendingIssuesCount,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Fallback if the active subscriptions endpoint fails
      try {
        const [usersResponse, complaintsResponse] = await Promise.all([
          axios.get("http://localhost:8081/api/users"),
          axios.get("http://localhost:8081/api/complaints")
        ]);
        
        const allUsers = usersResponse.data;
        const complaints = complaintsResponse.data;
        
        const customers = allUsers.filter(user => 
          (user.role !== "ADMIN" && user.role !== "ROLE_ADMIN") || 
          (user.subscriptionPlan && user.subscriptionPlan !== "NONE")
        );
        
        // Fallback: Count customers with active subscription plans
        const activeCustomersCount = customers.filter(customer => 
          customer.subscriptionPlan && 
          customer.subscriptionPlan !== "NONE" && 
          customer.subscriptionPlan !== "None" &&
          customer.subscriptionPlan !== "none" &&
          customer.subscriptionPlan !== ""
        ).length;
        
        const pendingIssuesCount = complaints.filter(complaint => 
          complaint.status === "OPEN" || complaint.status === "IN_PROGRESS"
        ).length;
        
        setAnalytics({
          totalCustomers: customers.length,
          activeCustomers: activeCustomersCount,
          totalComplaints: complaints.length,
          pendingIssues: pendingIssuesCount,
        });
      } catch (fallbackError) {
        console.error("Error in fallback analytics fetch:", fallbackError);
      }
    }
  };

  const fetchRecentUsers = async () => {
    try {
      // Fetch all users
      const response = await axios.get("http://localhost:8081/api/users");
      const allUsers = response.data;
      
      // Filter out admin users and get only customers
      const customers = allUsers.filter(user => 
        (user.role !== "ADMIN" && user.role !== "ROLE_ADMIN") || 
        (user.subscriptionPlan && user.subscriptionPlan !== "NONE")
      );
      
      // Sort by creation date and take the 5 most recent
      const recentCustomers = customers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
        
      setRecentUsers(recentCustomers);
    } catch (error) {
      console.error("Error fetching recent users:", error);
    }
  };

  const fetchRecentComplaints = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/complaints");
      const complaints = response.data;
      
      // Sort by creation date and take the 5 most recent
      const recentComplaints = complaints
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
        
      setRecentComplaints(recentComplaints);
    } catch (error) {
      console.error("Error fetching recent complaints:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
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
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Toolbar */}
      <header className="toolbar">
        <div className="toolbar-left">
          <div className="phone-logo">📞</div>
          <h1 className="toolbar-title">SkyLink Admin</h1>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {/* Tabs */}
      <div className="tab-bar">
        <div className="tab-container">
          {["Overview", "Customers", "Complaints", "Plans & Pricing"].map(
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

      {/* Analytics Boxes */}
      <div className="analytics-boxes">
        <div className="analytics-box">
          <div className="analytics-value">{analytics.totalCustomers}</div>
          <div className="analytics-label">Total Customers</div>
        </div>
        <div className="analytics-box">
          <div className="analytics-value">{analytics.activeCustomers}</div>
          <div className="analytics-label">Active Customers</div>
        </div>
        <div className="analytics-box">
          <div className="analytics-value">{analytics.totalComplaints}</div>
          <div className="analytics-label">Total Complaints</div>
        </div>
        <div className="analytics-box">
          <div className="analytics-value">{analytics.pendingIssues}</div>
          <div className="analytics-label">Pending Issues</div>
        </div>
      </div>

      {/* Recent Tables */}
  {activeTab === "Overview" && (
    <div className="recent-tables">
      {/* Plan Distribution Histogram */}
      <div className="recent-table">
        <h3>Customer Plan Distribution</h3>
        {Object.keys(planDistribution).length > 0 ? (
          <div className="chart-container">
            <Bar
              data={{
                labels: Object.keys(planDistribution),
                datasets: [
                  {
                    label: 'Number of Customers',
                    data: Object.values(planDistribution),
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF',
                      '#FF9F40'
                    ],
                    borderColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF',
                      '#FF9F40'
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Customers by Subscription Plan'
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Customers'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Subscription Plans'
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <p>No data available for plan distribution</p>
        )}
      </div>

      {/* Complaint Status Pie Chart */}
      <div className="recent-table">
        <h3>Complaint Status Overview</h3>
        {Object.keys(complaintStatus).length > 0 ? (
          <div className="chart-container">
            <Pie
              data={{
                labels: ['Pending', 'Resolved'],
                datasets: [
                  {
                    data: [complaintStatus.pending, complaintStatus.resolved],
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB'
                    ],
                    borderColor: [
                      '#FF6384',
                      '#36A2EB'
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: 'Complaint Status Distribution'
                  },
                },
              }}
            />
            <div className="chart-stats">
              <p>Total Complaints: {complaintStatus.pending + complaintStatus.resolved}</p>
              <p>Pending: {complaintStatus.pending} ({(complaintStatus.pending / (complaintStatus.pending + complaintStatus.resolved) * 100).toFixed(1)}%)</p>
              <p>Resolved: {complaintStatus.resolved} ({(complaintStatus.resolved / (complaintStatus.pending + complaintStatus.resolved) * 100).toFixed(1)}%)</p>
            </div>
          </div>
        ) : (
          <p>No data available for complaint status</p>
        )}
      </div>
    </div>
  )}

      {/* Other tabs */}
      {activeTab !== "Overview" && (
        <div className="tab-body">
          {activeTab === "Customers" && <Customers />}
          {activeTab === "Complaints" && <Complaints />}
          {activeTab === "Plans & Pricing" && <Plans />}
        </div>
      )}
    </div>
  );
};

// Customers Tab Component
const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchCustomersAndSubscriptions();
    }
  }, [token]);

  const fetchCustomersAndSubscriptions = async () => {
    try {
      // Fetch customers and subscriptions in parallel
      const [customersResponse, subscriptionsResponse] = await Promise.all([
        axios.get("http://localhost:8081/api/users", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        axios.get("http://localhost:8081/api/subscriptions", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);
      
      // Filter users to only include those with role "CUSTOMER"
      const customerUsers = customersResponse.data.filter(user => user.role === "CUSTOMER");
      setCustomers(customerUsers);
      setSubscriptions(subscriptionsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to get active subscription for a user
  const getActiveSubscription = (userId) => {
    return subscriptions.find(sub => 
      sub.userId === userId && 
      (sub.status === "ACTIVE" || sub.status === "active")
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="customers-tab">
      <h2>All Customers</h2>
      {customers.length > 0 ? (
        <div className="table-container">
          <table className="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Subscription Plan ID</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => {
                // Check if user has an active subscription
                const activeSubscription = getActiveSubscription(customer.id);
                const hasActiveSubscription = !!activeSubscription;
                
                // Determine status text and class
                const statusText = hasActiveSubscription ? "Active" : "Inactive";
                const statusClass = hasActiveSubscription ? "status-active" : "status-suspended";
                
                // Get subscription plan ID or show NONE
                const subscriptionPlanId = activeSubscription 
                  ? activeSubscription.planId || "N/A" 
                  : "NONE";
                
                return (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{subscriptionPlanId}</td>
                    <td className={statusClass}>
                      {statusText}
                    </td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td>{customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : "N/A"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No customers found</p>
      )}
    </div>
  );
};

// Complaints Tab Component
const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchComplaints();
    }
  }, [token]);

  const fetchComplaints = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/complaints", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setComplaints(response.data);
      setFilteredComplaints(response.data);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = (filterType) => {
    setActiveFilter(filterType);
    
    if (filterType === "ALL") {
      setFilteredComplaints(complaints);
    } else if (filterType === "PENDING") {
      const pendingComplaints = complaints.filter(complaint => 
        complaint.status === "OPEN" || complaint.status === "IN_PROGRESS"
      );
      setFilteredComplaints(pendingComplaints);
    } else {
      const resolvedComplaints = complaints.filter(complaint => 
        complaint.status === "RESOLVED" || complaint.status === "CLOSED"
      );
      setFilteredComplaints(resolvedComplaints);
    }
  };

  const resolveComplaint = async (complaintId) => {
    setUpdatingId(complaintId);
    try {
      await axios.put(`http://localhost:8081/api/complaints/${complaintId}/status`, 
        null, // No request body
        {
          params: {
            status: "RESOLVED",
            adminResponse: "Issue has been resolved by admin."
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state to reflect the change
      const updatedComplaints = complaints.map(complaint => 
        complaint.id === complaintId 
          ? {...complaint, status: "RESOLVED"} 
          : complaint
      );
      
      setComplaints(updatedComplaints);
      filterComplaints(activeFilter); // Reapply current filter
      
      alert("Complaint resolved successfully!");
    } catch (error) {
      console.error("Error resolving complaint:", error);
      alert("Failed to resolve complaint. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading complaints...</p>
      </div>
    );
  }

  return (
    <div className="complaints-tab">
      <h2>Complaints Management</h2>
      
      {/* Filter buttons */}
      <div className="complaint-filters">
        <button 
          className={`filter-btn ${activeFilter === "ALL" ? "active" : ""}`}
          onClick={() => filterComplaints("ALL")}
        >
          All Complaints
        </button>
        <button 
          className={`filter-btn ${activeFilter === "PENDING" ? "active" : ""}`}
          onClick={() => filterComplaints("PENDING")}
        >
          Pending Complaints
        </button>
        <button 
          className={`filter-btn ${activeFilter === "RESOLVED" ? "active" : ""}`}
          onClick={() => filterComplaints("RESOLVED")}
        >
          Resolved Complaints
        </button>
      </div>
      
      {filteredComplaints.length > 0 ? (
        <div className="table-container">
          <table className="complaints-table">
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Subject</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>#{complaint.id}</td>
                  <td>{complaint.subject}</td>
                  <td className="complaint-description">{complaint.description}</td>
                  <td className={
                    complaint.status === "OPEN" ? "status-new" :
                    complaint.status === "IN_PROGRESS" ? "status-inprogress" :
                    "status-resolved"
                  }>
                    {complaint.status ? complaint.status.replace("_", " ") : "UNKNOWN"}
                  </td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td>
                    {(complaint.status === "OPEN" || complaint.status === "IN_PROGRESS") && (
                      <button 
                        className="resolve-btn"
                        onClick={() => resolveComplaint(complaint.id)}
                        disabled={updatingId === complaint.id}
                      >
                        {updatingId === complaint.id ? "Processing..." : "Resolve"}
                      </button>
                    )}
                    {complaint.status === "RESOLVED" || complaint.status === "CLOSED" ? (
                      <span className="resolved-text">Resolved</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No complaints found</p>
      )}
    </div>
  );
};

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    durationInDays: "",
    dataLimitGB: "",
    speedMbps: "",
    active: true
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchPlans();
    }
  }, [token]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get("http://localhost:8081/api/plans", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPlans(response.data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingPlan({
      ...editingPlan,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8081/api/plans", formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setShowAddForm(false);
      setFormData({
        name: "",
        description: "",
        price: "",
        durationInDays: "",
        dataLimitGB: "",
        speedMbps: "",
        active: true
      });
      fetchPlans();
      alert("Plan added successfully!");
    } catch (error) {
      console.error("Error adding plan:", error);
      alert("Failed to add plan. Please try again.");
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8081/api/plans/${editingPlan.id}`, editingPlan, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEditingPlan(null);
      fetchPlans();
      alert("Plan updated successfully!");
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan. Please try again.");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm("Are you sure you want to delete this plan?")) {
      try {
        await axios.delete(`http://localhost:8081/api/plans/${planId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchPlans();
        alert("Plan deleted successfully!");
      } catch (error) {
        console.error("Error deleting plan:", error);
        alert("Failed to delete plan. Please try again.");
      }
    }
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      await axios.patch(`http://localhost:8081/api/plans/${planId}/status`, 
        { active: !currentStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      fetchPlans();
      alert("Plan status updated successfully!");
    } catch (error) {
      console.error("Error updating plan status:", error);
      alert("Failed to update plan status. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="plans-tab">
      <div className="plans-header">
        <h2>Plans & Pricing</h2>
        <button 
          className="add-plan-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Plan
        </button>
      </div>

      {/* Add Plan Form */}
      {showAddForm && (
        <div className="plan-form-overlay">
          <div className="plan-form">
            <h3>Add New Plan</h3>
            <form onSubmit={handleAddPlan}>
              <div className="form-group">
                <label>Plan Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹):</label> {/* Changed from ($) to (₹) */}
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (Days):</label>
                  <input
                    type="number"
                    name="durationInDays"
                    value={formData.durationInDays}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data Limit (GB):</label>
                  <input
                    type="number"
                    name="dataLimitGB"
                    value={formData.dataLimitGB}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Speed (Mbps):</label>
                  <input
                    type="number"
                    name="speedMbps"
                    value={formData.speedMbps}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={handleInputChange}
                  />
                  Active
                </label>
              </div>
              <div className="form-buttons">
                <button type="submit" className="save-btn">Save Plan</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Form */}
      {editingPlan && (
        <div className="plan-form-overlay">
          <div className="plan-form">
            <h3>Edit Plan</h3>
            <form onSubmit={handleUpdatePlan}>
              <div className="form-group">
                <label>Plan Name:</label>
                <input
                  type="text"
                  name="name"
                  value={editingPlan.name}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={editingPlan.description}
                  onChange={handleEditInputChange}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹):</label> {/* Changed from ($) to (₹) */}
                  <input
                    type="number"
                    name="price"
                    value={editingPlan.price}
                    onChange={handleEditInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (Days):</label>
                  <input
                    type="number"
                    name="durationInDays"
                    value={editingPlan.durationInDays}
                    onChange={handleEditInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Data Limit (GB):</label>
                  <input
                    type="number"
                    name="dataLimitGB"
                    value={editingPlan.dataLimitGB}
                    onChange={handleEditInputChange}
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Speed (Mbps):</label>
                  <input
                    type="number"
                    name="speedMbps"
                    value={editingPlan.speedMbps}
                    onChange={handleEditInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="active"
                    checked={editingPlan.active}
                    onChange={handleEditInputChange}
                  />
                  Active
                </label>
              </div>
              <div className="form-buttons">
                <button type="submit" className="save-btn">Update Plan</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setEditingPlan(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <span className={`status-badge ${plan.active ? 'active' : 'inactive'}`}>
                {plan.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="plan-description">
              <p>{plan.description}</p>
            </div>
            <div className="plan-details">
              <div className="plan-detail">
                <span className="detail-label">Price:</span>
                <span className="detail-value">₹{plan.price}</span> {/* Changed from $ to ₹ */}
              </div>
              <div className="plan-detail">
                <span className="detail-label">Duration:</span>
                <span className="detail-value">{plan.durationInDays} days</span>
              </div>
              <div className="plan-detail">
                <span className="detail-label">Data Limit:</span>
                <span className="detail-value">{plan.dataLimitGB} GB</span>
              </div>
              <div className="plan-detail">
                <span className="detail-label">Speed:</span>
                <span className="detail-value">{plan.speedMbps} Mbps</span>
              </div>
            </div>
            <div className="plan-actions">
              <button 
                className="edit-btn"
                onClick={() => setEditingPlan({...plan})}
              >
                Edit
              </button>
              <button 
                className="toggle-btn"
                onClick={() => togglePlanStatus(plan.id, plan.active)}
              >
                {plan.active ? 'Deactivate' : 'Activate'}
              </button>
              <button 
                className="delete-btn"
                onClick={() => handleDeletePlan(plan.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && !loading && (
        <p className="no-plans">No plans found. Click "Add New Plan" to create one.</p>
      )}
    </div>
  );
};

export default AdminOverview;
