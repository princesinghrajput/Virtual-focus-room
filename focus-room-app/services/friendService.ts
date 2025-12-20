import api from "./api";
import { API_ENDPOINTS } from "@/config/api";

export type Friend = {
    _id: string;
    name: string;
    email: string;
};

export type FriendRequest = {
    _id: string;
    sender: Friend;
    receiver: Friend;
    status: "pending" | "accepted" | "rejected";
    createdAt: string;
};

type FriendDetailsResponse = {
    success: boolean;
    friends: Friend[];
    receivedRequests: FriendRequest[];
    sentRequests: FriendRequest[];
};

type SearchUsersResponse = {
    success: boolean;
    users: Friend[];
};

// Get all friend details (friends list + pending requests)
export async function getFriendDetails(): Promise<FriendDetailsResponse> {
    return api.get<FriendDetailsResponse>(API_ENDPOINTS.FRIENDS.DETAILS);
}

// Send friend request
export async function sendFriendRequest(receiverId: string): Promise<{ success: boolean; message: string }> {
    return api.post(API_ENDPOINTS.FRIENDS.REQUEST, { receiverId });
}

// Accept friend request
export async function acceptFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    return api.post(API_ENDPOINTS.FRIENDS.ACCEPT, { requestId });
}

// Reject friend request
export async function rejectFriendRequest(requestId: string): Promise<{ success: boolean; message: string }> {
    return api.post(API_ENDPOINTS.FRIENDS.REJECT, { requestId });
}

// Search users by name
export async function searchUsers(query: string): Promise<SearchUsersResponse> {
    return api.get<SearchUsersResponse>(`${API_ENDPOINTS.FRIENDS.SEARCH}?q=${encodeURIComponent(query)}`);
}
