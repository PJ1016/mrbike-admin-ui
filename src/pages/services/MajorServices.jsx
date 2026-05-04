import React from "react";
import SharedServiceList from "../../components/Global/SharedServiceList";
import { getBaseServiceList, deleteBaseService } from "../../api";
import BuildIcon from "@mui/icons-material/Build";

const MajorServices = () => {
  return (
    <SharedServiceList
      title="Major Services"
      icon={<BuildIcon />}
      createPath="/create-base-service"
      editPathPrefix="/edit-base-service"
      fetchServices={getBaseServiceList}
      deleteService={deleteBaseService}
      searchPlaceholder="Search major services by name or description..."
      emptyMessageTitle="No major services found"
      emptyMessageDesc="Try adjusting your search or add a new major service to get started."
      itemName="Major Service"
    />
  );
};

export default MajorServices;
