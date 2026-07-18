import { dealerApi } from "./services/dealerApi";
import { dealerDataChanged } from "./slices/dealerRefreshSlice";
import { fetchGlobalSearchData } from "./slices/searchSlice";

// Call this after any successful dealer status mutation (block/unblock/activate/deactivate)
// so every screen holding its own copy of dealer data knows to refresh.
export const notifyDealerStatusChanged = (dispatch) => {
  dispatch(dealerDataChanged());
  dispatch(dealerApi.util.invalidateTags(["Dealer"]));
  dispatch(fetchGlobalSearchData());
};
