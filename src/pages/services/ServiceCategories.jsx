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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CategoryIcon from "@mui/icons-material/Category";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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

// Rendered on a <button> so the name is keyboard-reachable — hence the reset.
const categoryNameSx = {
  border: 0,
  p: 0,
  background: "none",
  fontFamily: "inherit",
  fontSize: "0.95rem",
  fontWeight: 700,
  color: "#1e293b",
  cursor: "pointer",
  textAlign: "left",
  "&:hover": { color: "#2563eb", textDecoration: "underline" },
};

const SortableTableRow = ({ category, index, onToggle, onEdit, onMenuOpen }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
  });

  const style = {
    // Translate only — a table row must not be scaled while it drags.
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: isDragging ? "#f8fafc" : undefined,
  };

  return (
    <TableRow ref={setNodeRef} style={style} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
      <TableCell sx={{ width: 56, pr: 0 }}>
        <Box
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", color: "#94a3b8", display: "flex", touchAction: "none" }}
        >
          <DragIndicatorIcon />
        </Box>
      </TableCell>

      <TableCell sx={{ color: "#94a3b8", fontWeight: 600, width: 60 }}>{index + 1}</TableCell>

      <TableCell sx={{ minWidth: 240 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CategoryIcon sx={{ color: "#2563eb", fontSize: 20 }} />
          </Box>
          <Typography component="button" onClick={() => onEdit(category)} sx={categoryNameSx}>
            {category.name}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell sx={{ minWidth: 140 }}>
        <Chip
          label={category.icon || "—"}
          size="small"
          sx={{ backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.72rem" }}
        />
      </TableCell>

      <TableCell sx={{ width: 110 }}>
        <Switch
          checked={!!category.isActive}
          onChange={(e) => onToggle(category, e.target.checked)}
          color="primary"
        />
      </TableCell>

      <TableCell align="center" sx={{ width: 80 }}>
        <IconButton size="small" onClick={(e) => onMenuOpen(e, category)} sx={{ color: "#64748b" }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

const SortableCard = ({ category, index, onToggle, onEdit, onMenuOpen }) => {
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
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          {...attributes}
          {...listeners}
          sx={{ cursor: "grab", color: "#94a3b8", display: "flex", touchAction: "none" }}
        >
          <DragIndicatorIcon />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="button" onClick={() => onEdit(category)} sx={categoryNameSx}>
            {index + 1}. {category.name}
          </Typography>
          <Chip
            label={category.icon || "—"}
            size="small"
            sx={{ mt: 0.75, backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600, fontSize: "0.72rem" }}
          />
        </Box>

        <Switch
          checked={!!category.isActive}
          onChange={(e) => onToggle(category, e.target.checked)}
          color="primary"
        />

        <IconButton size="small" onClick={(e) => onMenuOpen(e, category)} sx={{ color: "#64748b" }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
};

const ServiceCategories = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "", icon: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuCategory, setMenuCategory] = useState(null);

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

  const handleMenuOpen = (e, category) => {
    setAnchorEl(e.currentTarget);
    setMenuCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuCategory(null);
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

  const handleMenuEdit = () => {
    if (menuCategory) openEdit(menuCategory);
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    setDeleteTarget(menuCategory);
    setDeleteError(null);
    setAnchorEl(null);
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

  const rowProps = {
    onToggle: handleToggle,
    onEdit: openEdit,
    onMenuOpen: handleMenuOpen,
  };

  return (
    <Box sx={{ backgroundColor: "#f8fafc", minHeight: "100vh", pb: 8 }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ py: { xs: 3, md: 4 } }}>
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
            <Paper elevation={0} sx={{ py: 10, px: 3, textAlign: "center", borderRadius: "20px", border: "1px dashed #cbd5e1" }}>
              <Typography sx={{ color: "#64748b", fontWeight: 600 }}>No categories yet</Typography>
              <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
                Add one to start organizing services on Home.
              </Typography>
            </Paper>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
                {isMobile ? (
                  <Box>
                    {categories.map((category, index) => (
                      <SortableCard key={category._id} category={category} index={index} {...rowProps} />
                    ))}
                  </Box>
                ) : (
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{ borderRadius: "16px", border: "1px solid #e2e8f0", overflowX: "auto" }}
                  >
                    <Table sx={{ minWidth: 720 }}>
                      <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                        <TableRow>
                          {["", "#", "Category", "Icon", "Status", "Actions"].map((label, idx) => (
                            <TableCell
                              key={label || "drag"}
                              align={idx === 5 ? "center" : "left"}
                              sx={{
                                fontWeight: 700,
                                color: "#475569",
                                fontSize: "0.8rem",
                                textTransform: "uppercase",
                                letterSpacing: "0.04em",
                                whiteSpace: "nowrap",
                                borderBottom: "1px solid #e2e8f0",
                              }}
                            >
                              {label}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categories.map((category, index) => (
                          <SortableTableRow key={category._id} category={category} index={index} {...rowProps} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </SortableContext>
            </DndContext>
          )}
        </Box>
      </Container>

      {/* Row action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: { borderRadius: "12px", minWidth: 170, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" },
        }}
      >
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: "#2563eb" }} />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={600}>
            View / Edit
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "#ef4444" }} />
          </ListItemIcon>
          <Typography variant="body2" fontWeight={600} sx={{ color: "#ef4444" }}>
            Delete
          </Typography>
        </MenuItem>
      </Menu>

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
