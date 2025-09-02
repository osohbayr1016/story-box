import { Box, Modal, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeDialog } from "../../store/dialogueSlice";
import {
  addFilmCategory,
  editFilmCategory,
  getFilmCategory,
} from "../../store/filmSlice";
import { toast } from "react-toastify";
import Input from "../../extra/Input";
import Button from "../../extra/Button";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  backgroundColor: "background.paper",
  borderRadius: "5px",
  border: "1px solid #C9C9C9",
  boxShadow: "24px",
  // padding: '19px',
};
const FilmCategoryDialogue = ({ page, size }) => {
  const { dialogue: open, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const { filmsCategory, isLoading } = useSelector(
    (state) => state.films || {}
  );

  const [name, setName] = useState("");

  const dispatch = useDispatch();

  const handleCloseAds = () => {
    dispatch(closeDialog());
  };

  useEffect(() => {
    setName(dialogueData?.name || "");
    setErrors({});
  }, [dialogueData]);

  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const trimmedName = (name || "").trim();

    if (!trimmedName) {
      setErrors({ name: "Please enter name" });
      return;
    }

    // Prevent duplicate category names (case-insensitive). Exclude current when editing.
    const exists = Array.isArray(filmsCategory)
      ? filmsCategory.some((c) => {
          const same =
            (c?.name || "").trim().toLowerCase() === trimmedName.toLowerCase();
          if (!same) return false;
          if (!dialogueData) return true;
          return c?._id !== dialogueData?._id;
        })
      : false;

    if (exists) {
      setErrors({ name: "Category name already exists" });
      return;
    }

    if (dialogueData) {
      // If no actual change, avoid API call
      const original = (dialogueData?.name || "").trim().toLowerCase();
      if (original === trimmedName.toLowerCase()) {
        toast.info("No changes to save");
        return;
      }

      dispatch(
        editFilmCategory({ name: trimmedName, categoryId: dialogueData?._id })
      ).then((res) => {
        if (res?.payload?.status) {
          handleCloseAds();
          toast.success(res?.payload?.message);
          dispatch(getFilmCategory({ page, size }));
        } else {
          toast.error(res?.payload?.message || "Failed to update category");
        }
      });
    } else {
      dispatch(addFilmCategory({ name: trimmedName })).then((res) => {
        if (res?.payload?.status) {
          handleCloseAds();
          toast.success(res?.payload?.message);
          dispatch(getFilmCategory({ page, size }));
        } else {
          toast.error(res?.payload?.message || "Failed to add category");
        }
      });
    }
  };
  return (
    <div>
      <Modal
        open={open}
        onClose={handleCloseAds}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="">
          <div className="model-header">
            <p className="m-0">
              {dialogueData ? "Edit Film Category" : "Add Film Category"}
            </p>
          </div>
          <div className="model-body">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div
                className="row sound-add-box"
                style={{ overflowX: "hidden" }}
              >
                <Input
                  type={"text"}
                  label={"Name"}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrors({ ...errors, name: "" });
                  }}
                  name={"name"}
                  value={name || ""}
                />
                {errors?.name && (
                  <span
                    className="error mb-2"
                    style={{ fontSize: "15px", color: "red" }}
                  >
                    {errors?.name}
                  </span>
                )}
              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className="m-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseAds}
                btnName={"Close"}
                newClass={"close-model-btn"}
              />
              <Button
                onClick={handleSubmit}
                btnName={"Submit"}
                type={"submit"}
                disabled={!!isLoading}
                newClass={"submit-btn"}
                style={{
                  borderRadius: "0.5rem",
                  width: "80px",
                  marginLeft: "10px",
                }}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
};
export default FilmCategoryDialogue;
