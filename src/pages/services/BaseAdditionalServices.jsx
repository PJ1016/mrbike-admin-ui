import React from "react";
import SharedServiceList from "../../components/Global/SharedServiceList";
import { getBaseAdditionalServices, deleteBaseAdditionalService } from "../../api/additionalServiceApi";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";

const BaseAdditionalServices = () => {
  // Wrap delete function to match expected signature (id, force, deactivate)
  const handleDelete = (id, force, deactivate) => {
    return deleteBaseAdditionalService(id, { force, deactivate });
  };

  return (
    <SharedServiceList
      title="Additional Services"
      icon={<LibraryAddIcon />}
      createPath="/create-base-additional-service"
      editPathPrefix="/edit-base-additional-service"
      fetchServices={getBaseAdditionalServices}
      deleteService={handleDelete}
      searchPlaceholder="Search services by name or description..."
      emptyMessageTitle="No services found"
      emptyMessageDesc="Try adjusting your search or add a new service to get started."
      itemName="Additional Service"
    />
  );
};

export default BaseAdditionalServices;
