"use client";
import React from "react";
import Image from "next/image";
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

interface UserInfoPanelProps {
  participantDetails: {
    [key: number]: {
      avatar_url?: string | null;
      full_name?: string;
      isOnline?: boolean;
      phone?: string;
      email?: string;
      location?: string;
    };
  };
  userId: number;
}

const UserInfoPanel: React.FC<UserInfoPanelProps> = ({ participantDetails, userId }) => {
  const otherUserId = Object.keys(participantDetails)
    .map(Number)
    .find(id => id !== userId);
  
  if (!otherUserId) return null;

  const userInfo = participantDetails[otherUserId];
  if (!userInfo) return null;

  const avatarUrl = userInfo.avatar_url 
    ? (userInfo.avatar_url.startsWith('http') || userInfo.avatar_url.startsWith('/')
        ? userInfo.avatar_url
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/avatars/${userInfo.avatar_url}`)
    : null;

  return (
    <div className="w-80 border-l border-gray-200 bg-white p-6 flex flex-col">
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-24 h-24 mb-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userInfo.full_name || ""}
              fill
              className="rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<div class="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                    <FaUser className="w-12 h-12 text-gray-400" />
                  </div>`;
                }
              }}
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
              <FaUser className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
            userInfo.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{userInfo.full_name}</h3>
        <p className="text-sm text-gray-500">{userInfo.isOnline ? "В сети" : "Не в сети"}</p>
      </div>

      <div className="space-y-4">
        {userInfo.phone && (
          <div className="flex items-center space-x-3">
            <FaPhone className="w-5 h-5 text-gray-400" />
            <a href={`tel:${userInfo.phone}`} className="text-gray-600 hover:text-blue-500">
              {userInfo.phone}
            </a>
          </div>
        )}

        {userInfo.email && (
          <div className="flex items-center space-x-3">
            <FaEnvelope className="w-5 h-5 text-gray-400" />
            <a href={`mailto:${userInfo.email}`} className="text-gray-600 hover:text-blue-500">
              {userInfo.email}
            </a>
          </div>
        )}

        {userInfo.location && (
          <div className="flex items-center space-x-3">
            <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
            <span className="text-gray-600">{userInfo.location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfoPanel; 