import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "../firebase";
import { LogOut, CheckCircle, XCircle } from "lucide-react";

function Scanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [message, setMessage] = useState("");
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isScannerActive) {
      const readerElement = document.getElementById("reader");
      if (!readerElement) return;

      const qrScanner = new Html5QrcodeScanner("reader", {
        qrbox: { width: 250, height: 250 },
        fps: 5,
      });

      qrScanner.render(async (decodedText) => {
        try {
          const ticketRef = doc(db, "tickets", decodedText);
          const ticketSnap = await getDoc(ticketRef);

          if (ticketSnap.exists()) {
            const ticketData = ticketSnap.data();
            setTicketDetails(ticketData);
            setScanResult(decodedText);
            setStatus("success");
            setMessage("Ticket scanned successfully.");
            setShowModal(true);
          } else {
            setStatus("error");
            setMessage("Invalid ticket.");
          }
        } catch (error) {
          setStatus("error");
          setMessage("Error fetching ticket details.");
        }
      }, (error) => {
        console.error(error);
        setStatus("error");
        setMessage("Error accessing camera.");
      });
    }
  }, [isScannerActive]);

  const toggleScanner = () => {
    setIsScannerActive(!isScannerActive);
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const markTicketValid = async () => {
    if (!scanResult) return;

    try {
      const ticketRef = doc(db, "tickets", scanResult);
      await updateDoc(ticketRef, {
        status: "used",
        remarks: remarks || "No remarks",
        validatedBy: auth.currentUser?.email,
        validatedAt: new Date().toISOString(),
      });

      setStatus("success");
      setMessage("Ticket marked as valid.");
      setShowModal(false);
      setRemarks("");
      setTimeout(() => {
        setIsScannerActive(false);
      }, 1500);
    } catch (error) {
      setStatus("error");
      setMessage("Error updating ticket.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ticket Scanner</h1>
          <button onClick={handleLogout} className="flex items-center px-4 py-2 text-sm text-red-600 hover:text-red-800">
            <LogOut className="h-5 w-5 mr-2" /> Logout
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden p-4">
          <button onClick={toggleScanner} className={`w-full py-2 px-4 mb-4 rounded text-white ${isScannerActive ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}`}> {isScannerActive ? "Close Scanner" : "Open Scanner"} </button>
          {isScannerActive && <div id="reader" className="w-full"></div>}
        </div>
      </div>

      {/* Modal for Ticket Details */}
      {showModal && ticketDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Ticket Details</h2>
            {ticketDetails.photoURL && (
              <img src={ticketDetails.photoURL} alt="User" className="w-24 h-24 rounded-full mx-auto mb-4" />
            )}
            <p><strong>Name:</strong> {ticketDetails.userName}</p>
            <p><strong>Email:</strong> {ticketDetails.userEmail}</p>
            <p><strong>Event:</strong> {ticketDetails.eventName}</p>
            <p><strong>Status:</strong> {ticketDetails.status}</p>
            
            <label className="block mt-4">
              <span className="text-gray-700">Remarks (Optional):</span>
              <input type="text" className="mt-1 p-2 w-full border rounded" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any remarks..." />
            </label>

            <div className="flex justify-end mt-4 space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
              <button onClick={markTicketValid} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Mark as Used</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scanner;
