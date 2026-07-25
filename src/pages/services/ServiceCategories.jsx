import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CategoryIcon from "@mui/icons-material/Category";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PageHeader from "../../components/Global/PageHeader";
import IconPicker from "../../components/Common/IconPicker";
import {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  updateServiceCategoryStatus,
  reorderServiceCategories,
  deleteServiceCategory,
} from "../../api";

const SortableRow = ({ category, onToggle, onEdit, onDeleteClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={0}
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", color: "#94a3b8", display: "flex" }}
        >
          <DragIndicatorIcon />
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "10px",
            backgroundColor: "#eff6ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CategoryIcon sx={{ color: "#2563eb", fontSize: 20 }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: "#1e293b" }}>{category.name}</Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            icon: {category.icon}
          </Typography>
        </Box>

        <Switch
          checked={!!category.isActive}
          onChange={(e) => onToggle(category, e.target.checked)}
          color="primary"
        />

        <Tooltip title="Edit">
          <IconButton onClick={() => onEdit(category)} sx={{ color: "#64748b" }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton onClick={() => onDeleteClick(category)} sx={{ color: "#94a3b8", "&:hover": { color: "#ef4444" } }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

const ServiceCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await getServiceCategories();
      if (res?.status) setCategories(res.data || []);
    } catch (error) {
      console.error("Error fetching service categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const categoryIds = useMemo(() => categories.map((c) => c._id), [categories]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c._id === active.id);
    const newIndex = categories.findIndex((c) => c._id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered); // optimistic

    try {
      await reorderServiceCategories(reordered.map((c) => c._id));
    } catch (error) {
      console.error("Error reordering categories:", error);
      loadCategories(); // revert to server truth on failure
    }
  };

  const handleToggle = async (category, isActive) => {
    setCategories((prev) => prev.map((c) => (c._id === category._id ? { ...c, isActive } : c)));
    try {
      await updateServiceCategoryStatus(category._id, isActive);
    } catch (error) {
      console.error("Error toggling category status:", error);
      loadCategories();
    }
  };

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: "", icon: "" });
    setFormErrors({});
    setGlobalError(null);
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name, icon: category.icon });
    setFormErrors({});
    setGlobalError(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.icon) errors.icon = "Pick an icon";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    setGlobalError(null);
    try {
      if (editingCategory) {
        await updateServiceCategory(editingCategory._id, form);
      } else {
        await createServiceCategory(form);
      }
      setDialogOpen(false);
      loadCategories();
    } catch (error) {
      setGlobalError(error?.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteServiceCategory(deleteTarget._id);
      setDeleteTarget(null);
      loadCategories();
    } catch (error) {
      setDeleteError(error?.response?.data?.message || "Could not delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <PageHeader
            title="Service Categories"
            breadcrumbs={[
              { label: "Dashboard", path: "/" },
              { label: "Services", path: "/MajorServices" },
              { label: "Categories", path: "#" },
            ]}
            action={{ label: "New Category", icon: <AddIcon />, onClick: openCreate }}
          />

          <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
            Drag to reorder — this order is what riders see under "Browse by Category" on Home.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
              <CircularProgress size={40} sx={{ color: "#2563eb" }} />
            </Box>
          ) : categories.length === 0 ? (
            <Paper elevation={0} sx={{ py: 10, textAlign: "center", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>No categories yet</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
                Add one to start organizing services on Home.
              </Typography>
            </Paper>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
                {categories.map((category) => (
                  <SortableRow
                    key={category._id}
                    category={category}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDeleteClick={setDeleteTarget}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </Box>
      </Container>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
        <DialogContent>
          {globalError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {globalError}
            </Alert>
          )}
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Category Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              size="small"
            />
            <IconPicker
              value={form.icon}
              onChange={(icon) => setForm((f) => ({ ...f, icon }))}
              error={formErrors.icon}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={submitting}
            sx={{ textTransform: "none", fontWeight: 600, backgroundColor: "#2563eb" }}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : editingCategory ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete category?</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Are you sure you want to delete <b>"{deleteTarget?.name}"</b>? This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 600, backgroundColor: "#ef4444" }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServiceCategories;
