import React from "react";
import { Trash2 } from "lucide-react";
type DeleteResourceProps = {
  id: string;
  type: string;
  title: string;
};

const DeleteResource: React.FC<DeleteResourceProps> = ({ id, type, title }) => {
  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this ${title}?`
    );
    if (confirmed) {
      fetch(`/api/${type}/${id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete resource");
          }
          return response.json();
        })
        .then(() => {
          alert(`${title} deleted successfully`);
          window.location.reload(); // Reload the page to reflect changes
        })
        .catch((error) => {
          console.error("Error deleting resource:", error);
          alert("Failed to delete resource. Please try again.");
        });
    }
  };

  return (
    <button
      onClick={handleDelete}
      className=" mr-2 relative p-2 bg-red-600 text-white rounded hover:bg-red-700 transition z-10"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};

export default DeleteResource;
