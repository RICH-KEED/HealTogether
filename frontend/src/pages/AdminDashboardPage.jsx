import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { 
  Users, Shield, Copy, Check, X, Loader2, 
  SquareStack, MessageCircle, School, Heart, Brain,
  BarChart2, Search, Filter, Trash, AlertTriangle,
  UserPlus, Settings, ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const AdminDashboardPage = () => {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserStats, setShowUserStats] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [groups, setGroups] = useState([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Group creation form
  const [groupForm, setGroupForm] = useState({
    name: "",
    type: "",
    description: ""
  });

  // Ensure only admin can access this page
  useEffect(() => {
    if (authUser?.role !== "admin") {
      navigate("/");
    }
  }, [authUser, navigate]);

  // Fetch pending users
  useEffect(() => {
    const fetchPendingUsers = async () => {
      setIsLoading(true);
      try {
        const res = await axiosInstance.get("/admin/pending-users");
        setPendingUsers(res.data);
      } catch (error) {
        toast.error("Failed to load pending users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  // Fetch all users for statistics
  useEffect(() => {
    if (showUserStats) {
      const fetchAllUsers = async () => {
        setIsLoadingStats(true);
        try {
          const res = await axiosInstance.get("/admin/all-users");
          setAllUsers(res.data);
        } catch (error) {
          toast.error("Failed to load users statistics");
        } finally {
          setIsLoadingStats(false);
        }
      };

      fetchAllUsers();
    }
  }, [showUserStats]);

  // Fetch groups when showing the groups modal
  useEffect(() => {
    if (showGroups) {
      const fetchGroups = async () => {
        setIsLoadingGroups(true);
        try {
          const res = await axiosInstance.get("/admin/groups");
          setGroups(res.data);
        } catch (error) {
          toast.error("Failed to load groups");
        } finally {
          setIsLoadingGroups(false);
        }
      };

      fetchGroups();
    }
  }, [showGroups]);

  const handleVerifyUser = async (userId) => {
    setIsVerifying(true);
    try {
      const res = await axiosInstance.post(`/admin/verify-user/${userId}`);
      
      // Update the pending users list
      setPendingUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, status: "verified", referralCode: res.data.referralCode } 
            : user
        )
      );
      
      toast.success("User verified successfully");
    } catch (error) {
      toast.error("Failed to verify user");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRejectUser = async (userId) => {
    setIsVerifying(true);
    try {
      await axiosInstance.post(`/admin/reject-user/${userId}`);
      
      // Remove the rejected user from the list
      setPendingUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      
      toast.success("User rejected");
    } catch (error) {
      toast.error("Failed to reject user");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    
    if (!groupForm.name || !groupForm.type || !groupForm.description) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsCreatingGroup(true);
    try {
      await axiosInstance.post("/admin/create-group", groupForm);
      toast.success(`${groupForm.name} group created successfully`);
      setShowCreateGroup(false);
      setGroupForm({ name: "", type: "", description: "" });
    } catch (error) {
      toast.error("Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };
  
  const handleDeleteUser = async (userId) => {
    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/admin/delete-user/${userId}`);
      
      // Remove the deleted user from the list
      setAllUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      
      toast.success("User deleted successfully");
      setUserToDelete(null);
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        (user.referralCode && user.referralCode.toLowerCase().includes(userSearchQuery.toLowerCase()));
                        
    if (userFilter === 'all') return matchesSearch;
    if (userFilter === 'user') return matchesSearch && user.role === 'user';
    if (userFilter === 'therapist') return matchesSearch && user.role === 'therapist';
    if (userFilter === 'ngo') return matchesSearch && user.role === 'ngo';
    if (userFilter === 'volunteer') return matchesSearch && user.role === 'volunteer';
    return matchesSearch;
  });

  // Calculate user statistics
  const userStats = {
    total: allUsers.length,
    users: allUsers.filter(u => u.role === 'user').length,
    therapists: allUsers.filter(u => u.role === 'therapist').length,
    ngos: allUsers.filter(u => u.role === 'ngo').length,
    volunteers: allUsers.filter(u => u.role === 'volunteer').length,
    verified: allUsers.filter(u => u.status === 'verified').length,
    pending: allUsers.filter(u => u.status === 'pending').length
  };

  return (
    <div className="min-h-screen pt-20 bg-base-200 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        
        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-base-100 p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <Users className="w-6 h-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Manage Users</h2>
            </div>
            <p className="text-base-content/70 mb-4">
              Review and verify professional account requests
            </p>
            <div className="flex justify-end">
              <span className="badge badge-primary">
                {pendingUsers.length} pending
              </span>
            </div>
          </div>
          
          <div 
            className="bg-base-100 p-6 rounded-xl shadow-md cursor-pointer"
            onClick={() => setShowCreateGroup(true)}  
          >
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Create Group</h2>
            </div>
            <p className="text-base-content/70 mb-4">
              Create new support groups for different topics
            </p>
            <div className="flex justify-end">
              <button className="btn btn-sm btn-primary">Create New</button>
            </div>
          </div>
          
          <div 
            className="bg-base-100 p-6 rounded-xl shadow-md cursor-pointer"
            onClick={() => setShowGroups(true)}  
          >
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">Manage Groups</h2>
            </div>
            <p className="text-base-content/70 mb-4">
              View and manage existing support groups
            </p>
            <div className="flex justify-end">
              <button className="btn btn-sm btn-primary">View Groups</button>
            </div>
          </div>
          
          <div 
            className="bg-base-100 p-6 rounded-xl shadow-md cursor-pointer"
            onClick={() => setShowUserStats(true)}  
          >
            <div className="flex items-center mb-4">
              <BarChart2 className="w-6 h-6 mr-2 text-primary" />
              <h2 className="text-xl font-semibold">User Statistics</h2>
            </div>
            <p className="text-base-content/70 mb-4">
              View and analyze user data and platform statistics
            </p>
            <div className="flex justify-end">
              <button className="btn btn-sm btn-primary">View Stats</button>
            </div>
          </div>
        </div>
        
        {/* Pending Users Table */}
        <div className="bg-base-100 rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Verifications</h2>
          
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center p-8 text-base-content/70">
              No pending verification requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                            </div>
                          </div>
                          <div>{user.fullName}</div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className="badge badge-ghost">{user.role}</span>
                      </td>
                      <td>
                        {user.status === "pending" ? (
                          <span className="badge badge-warning">Pending</span>
                        ) : user.status === "verified" ? (
                          <span className="badge badge-success">Verified</span>
                        ) : (
                          <span className="badge badge-error">Rejected</span>
                        )}
                      </td>
                      <td>
                        {user.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleVerifyUser(user._id)} 
                              className="btn btn-sm btn-success"
                              disabled={isVerifying}
                            >
                              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check size={16} />}
                            </button>
                            <button 
                              onClick={() => handleRejectUser(user._id)} 
                              className="btn btn-sm btn-error"
                              disabled={isVerifying}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : user.status === "verified" ? (
                          <div className="flex items-center">
                            <span className="font-mono text-xs mr-2">{user.referralCode}</span>
                            <button 
                              onClick={() => copyToClipboard(user.referralCode)}
                              className="btn btn-sm btn-ghost btn-square"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Create Group Modal */}
        {showCreateGroup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Create Support Group</h3>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="form-control">
                  <label className="label">Group Name</label>
                  <input 
                    type="text" 
                    className="input input-bordered w-full"
                    placeholder="Enter group name" 
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Group Type</label>
                  <select 
                    className="select select-bordered w-full"
                    value={groupForm.type}
                    onChange={(e) => setGroupForm({...groupForm, type: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select group type</option>
                    <option value="mental">Mental Health</option>
                    <option value="relationship">Relationship</option>
                    <option value="academic">Academic</option>
                  </select>
                </div>
                
                <div className="form-control">
                  <label className="label">Description</label>
                  <textarea 
                    className="textarea textarea-bordered w-full" 
                    placeholder="Group description"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                    required
                  ></textarea>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button 
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setShowCreateGroup(false)}
                    disabled={isCreatingGroup}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="btn btn-primary"
                    disabled={isCreatingGroup}
                  >
                    {isCreatingGroup ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating...</>
                    ) : (
                      "Create Group"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* User Statistics Modal */}
        {showUserStats && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-4xl w-full h-4/5 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">User Statistics</h3>
                <button 
                  className="btn btn-sm btn-circle"
                  onClick={() => setShowUserStats(false)}
                >
                  <X size={16} />
                </button>
              </div>
              
              {isLoadingStats ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-base-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-base-content/70">Total Users</p>
                      <p className="text-3xl font-bold">{userStats.total}</p>
                    </div>
                    <div className="bg-base-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-base-content/70">Regular Users</p>
                      <p className="text-3xl font-bold">{userStats.users}</p>
                    </div>
                    <div className="bg-base-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-base-content/70">Therapists</p>
                      <p className="text-3xl font-bold">{userStats.therapists}</p>
                    </div>
                    <div className="bg-base-200 p-4 rounded-lg text-center">
                      <p className="text-sm text-base-content/70">Verified</p>
                      <p className="text-3xl font-bold">{userStats.verified}</p>
                    </div>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search by name, email or referral code"
                        className="input input-bordered w-full pl-10"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex gap-2 items-center">
                      <Filter size={18} className="text-base-content/70" />
                      <select 
                        className="select select-bordered"
                        value={userFilter}
                        onChange={(e) => setUserFilter(e.target.value)}
                      >
                        <option value="all">All Roles</option>
                        <option value="user">Users</option>
                        <option value="therapist">Therapists</option>
                        <option value="ngo">NGOs</option>
                        <option value="volunteer">Volunteers</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Users Table */}
                  <div className="overflow-y-auto flex-1">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center p-8 text-base-content/70">
                        No users found matching your criteria
                      </div>
                    ) : (
                      <table className="table table-sm">
                        <thead className="sticky top-0 bg-base-100">
                          <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Referral Code</th>
                            <th>Joined</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map(user => (
                            <tr key={user._id}>
                              <td>
                                <div className="flex items-center gap-2">
                                  <div className="avatar">
                                    <div className="w-8 h-8 rounded-full">
                                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                                    </div>
                                  </div>
                                  <span className="font-medium">{user.fullName}</span>
                                </div>
                              </td>
                              <td className="text-sm">{user.email}</td>
                              <td><span className="badge badge-sm">{user.role}</span></td>
                              <td>
                                <span className={`badge badge-sm ${
                                  user.status === "verified" ? "badge-success" : 
                                  user.status === "pending" ? "badge-warning" : "badge-error"
                                }`}>
                                  {user.status}
                                </span>
                              </td>
                              <td>
                                {user.referralCode ? (
                                  <div className="flex items-center">
                                    <span className="font-mono text-xs">{user.referralCode}</span>
                                    <button 
                                      onClick={() => copyToClipboard(user.referralCode)}
                                      className="ml-1 btn btn-xs btn-ghost btn-square"
                                    >
                                      <Copy size={12} />
                                    </button>
                                  </div>
                                ) : "-"}
                              </td>
                              <td className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                              <td>
                                {user.role !== "admin" && (
                                  <button 
                                    onClick={() => setUserToDelete(user)}
                                    className="btn btn-xs btn-error btn-square"
                                  >
                                    <Trash size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Delete User Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
            <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-error/15 flex items-center justify-center">
                  <AlertTriangle className="text-error w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Delete User</h3>
              </div>
              
              <p className="mb-6">
                Are you sure you want to delete <span className="font-medium">{userToDelete.fullName}</span>? 
                This action cannot be undone, and all associated data will be permanently removed.
              </p>
              
              <div className="flex justify-end gap-3">
                <button 
                  className="btn btn-ghost" 
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-error" 
                  onClick={() => handleDeleteUser(userToDelete._id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete User"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Groups Management Modal */}
        {showGroups && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 p-6 rounded-lg shadow-lg max-w-4xl w-full h-4/5 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Manage Support Groups</h3>
                <button 
                  className="btn btn-sm btn-circle"
                  onClick={() => {
                    setShowGroups(false);
                    setSelectedGroup(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              
              {isLoadingGroups ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : selectedGroup ? (
                // Group detail view
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => setSelectedGroup(null)}
                    >
                      <ArrowLeft size={16} className="mr-2" />
                      Back to groups
                    </button>
                    
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-error">
                        <Trash size={14} className="mr-1" /> Delete Group
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-base-200 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">{selectedGroup.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="badge badge-sm">
                            {selectedGroup.type.charAt(0).toUpperCase() + selectedGroup.type.slice(1)}
                          </span>
                          <span className="text-sm text-base-content/70">
                            Created {new Date(selectedGroup.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{selectedGroup.members?.length || 0} members</span>
                      </div>
                    </div>
                    
                    <p className="mt-3 text-sm">{selectedGroup.description}</p>
                  </div>
                  
                  <h5 className="font-medium mb-3">Group Members</h5>
                  
                  <div className="overflow-y-auto flex-1 border border-base-300 rounded-lg">
                    {selectedGroup.members?.length > 0 ? (
                      <div className="divide-y divide-base-300">
                        {selectedGroup.members.map(member => (
                          <div key={member._id} className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src={member.profilePic || "/avatar.png"} alt={member.fullName} />
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{member.fullName}</div>
                                <div className="text-xs text-base-content/70">{member.email}</div>
                              </div>
                            </div>
                            
                            <button 
                              className="btn btn-sm btn-ghost text-error"
                              onClick={() => {/* Remove member */}}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-base-content/60">
                        No members in this group yet
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Groups list view
                <>
                  <div className="flex justify-between mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search groups..."
                        className="input input-bordered w-full pl-10"
                      />
                    </div>
                    
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateGroup(true)}
                    >
                      <MessageCircle size={18} className="mr-2" />
                      Create New Group
                    </button>
                  </div>
                  
                  <div className="overflow-y-auto flex-1">
                    {groups.length === 0 ? (
                      <div className="text-center p-8 text-base-content/70">
                        No groups created yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {groups.map(group => (
                          <div 
                            key={group._id}
                            className="border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors cursor-pointer"
                            onClick={() => setSelectedGroup(group)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{group.name}</h4>
                              <span className="badge">
                                {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                              {group.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-xs">{group.members?.length || 0} members</span>
                              <button className="btn btn-xs btn-primary">
                                Manage
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
