// AddProduct.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

// Import new components
import ProductBasicInfo from "./ProductBasicInfo";
import ProductTags from "./ProductTags";
import ProductAttributes from "./ProductAttributes";
import ProductVariations from "./ProductVariations";
import ProductVariants from "./ProductVariants";
import ProductImages from "./ProductImages";

export default function AddProduct() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);

  const [basic, setBasic] = useState({
    name: "",
    description: "",
    basePrice: "",
    minOrderQuantity: 1,
    discountStart: null,
    discountEnd: null,
    // MODIFIED: Only maxDiscountPercentage remains for discount input
    maxDiscountPercentage: null,
    pricingType: "flat",
    isActive: true,
    categoryId: "",
    subCategoryId: null,
    sku: "",
  });

  const [allFetchedCategories, setAllFetchedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [variations, setVariations] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const token = localStorage.getItem("authToken");

  const [productId, setProductId] = useState(() => {
    try {
      const storedProductId = sessionStorage.getItem("currentProductId");
      return storedProductId ? Number(storedProductId) : null;
    } catch (error) {
      console.error("Error reading productId from sessionStorage:", error);
      return null;
    }
  });

  useEffect(() => {
    if (productId && currentStep === 1) {
      Swal.fire({
        title: "Continue Product Creation?",
        text: `A product with ID ${productId} was previously started. Do you want to continue adding images, or start a new product?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "No, start new product",
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          setCurrentStep(2);
        } else {
          sessionStorage.removeItem("currentProductId");
          setProductId(null);
          setBasic({
            name: "",
            description: "",
            basePrice: "",
            minOrderQuantity: 1,
            discountStart: null,
            discountEnd: null,
            maxDiscountPercentage: null, // Reset here too
            pricingType: "flat",
            isActive: true,
            categoryId: "",
            subCategoryId: null,
            sku: "",
          });
          setTags([]);
          setAttributes([]);
          setVariations([]);
          setVariants([]);
        }
      });
    }

    const fetchAllCategories = async () => {
      try {
        const res = await axios.get(
          "https://test.api.dpmsign.com/api/product-category"
        );
        const allCategoriesData = res.data.data.categories;
        setAllFetchedCategories(allCategoriesData);

        const topLevelCats = allCategoriesData.filter(
          (cat) => cat.parentCategoryId === null
        );
        setCategories(topLevelCats);
      } catch (err) {
        console.error("Error fetching categories:", err);
        Swal.fire("Error", "Could not load categories.", "error");
      }
    };
    fetchAllCategories();
  }, [productId, currentStep]);

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "categoryId") {
      const selectedCategoryId = Number(value);
      const selectedCategory = allFetchedCategories.find(
        (cat) => cat.categoryId === selectedCategoryId
      );

      setBasic((prev) => ({
        ...prev,
        categoryId: selectedCategoryId,
        subCategoryId: null,
      }));
      setSubCategories(selectedCategory?.subCategories || []);
    } else if (name === "subCategoryId") {
      setBasic((prev) => ({
        ...prev,
        subCategoryId: Number(value),
      }));
    } else {
      setBasic((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : value === ""
            ? null
            : Number.isNaN(Number(value))
            ? value
            : Number(value),
      }));
    }
  };

  const addTag = () => setTags((prev) => [...prev, ""]);
  const updateTag = (i, val) =>
    setTags((prev) => prev.map((t, idx) => (idx === i ? val : t)));
  const removeTag = (i) =>
    setTags((prev) => prev.filter((_, idx) => idx !== i));

  const addAttr = () =>
    setAttributes((prev) => [...prev, { property: "", description: "" }]);
  const updateAttr = (i, field, val) =>
    setAttributes((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: val } : a))
    );
  const removeAttr = (i) =>
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));

  const addVar = () =>
    setVariations((prev) => [
      ...prev,
      { name: "", unit: "", variationItems: [] },
    ]);
  const updateVar = (i, field, val) =>
    setVariations((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: val } : v))
    );
  const addVarItem = (i) =>
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? { ...v, variationItems: [...v.variationItems, { value: "" }] }
          : v
      )
    );
  const updateVarItem = (i, j, val) =>
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variationItems: v.variationItems.map((vi, viIdx) =>
                viIdx === j ? { ...vi, value: val } : vi
              ),
            }
          : v
      )
    );
  const removeVarItem = (i, j) =>
    setVariations((prev) =>
      prev.map((v, idx) =>
        idx === i
          ? {
              ...v,
              variationItems: v.variationItems.filter(
                (_, viIdx) => viIdx !== j
              ),
            }
          : v
      )
    );
  const removeVar = (i) =>
    setVariations((prev) => prev.filter((_, idx) => idx !== i));

  const updateVt = (i, field, val) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: val } : v))
    );
  const removeVt = (i) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const generatePermutations = (variationsArray) => {
    if (!variationsArray || variationsArray.length === 0) {
      return [[]];
    }

    const firstVariation = variationsArray[0];
    const remainingVariations = variationsArray.slice(1);

    const partialPermutations = generatePermutations(remainingVariations);
    const result = [];

    firstVariation.variationItems.forEach((item) => {
      partialPermutations.forEach((permutation) => {
        result.push([
          {
            variationName: firstVariation.name,
            variationItemValue: item.value,
          },
          ...permutation,
        ]);
      });
    });
    return result;
  };

  const handleCreateVariants = () => {
    const isValid = variations.every(
      (v) =>
        v.name &&
        v.variationItems.length > 0 &&
        v.variationItems.every((item) => item.value)
    );

    if (!isValid) {
      Swal.fire(
        "Validation Error",
        "Please ensure all variations have a name and at least one item with a value.",
        "warning"
      );
      return;
    }

    const validVariations = variations
      .filter(
        (v) =>
          v.variationItems &&
          v.variationItems.length > 0 &&
          v.variationItems.every((item) => item.value)
      )
      .map((v) => ({
        name: v.name,
        unit: v.unit,
        variationItems: v.variationItems.filter((item) => item.value),
      }));

    if (validVariations.length === 0) {
      setVariants([]);
      Swal.fire(
        "Info",
        "No valid variations with items to create variants from.",
        "info"
      );
      return;
    }

    const generatedVariantDetails = generatePermutations(validVariations);

    const newVariants = generatedVariantDetails.map((detailSet) => ({
      additionalPrice: 0,
      variantDetails: detailSet,
    }));

    setVariants(newVariants);
    Swal.fire(
      "Success",
      `${newVariants.length} variants generated!`,
      "success"
    );
  };

  const uploadNewImages = (e) => {
    const files = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...files]);
  };
  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductInfoSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { sku, subCategoryId, categoryId, ...restBasic } = basic;
      const finalCategoryId = subCategoryId || categoryId;

      if (!finalCategoryId) {
        Swal.fire(
          "Validation Error",
          "Please select a category or sub-category.",
          "warning"
        );
        setSubmitting(false);
        return;
      }

      const productDetails = {
        name: restBasic.name,
        description: restBasic.description,
        basePrice: Number(restBasic.basePrice),
        minOrderQuantity: Number(restBasic.minOrderQuantity),
        pricingType: restBasic.pricingType,
        isActive: restBasic.isActive,
        categoryId: finalCategoryId || null,
        attributes: attributes,
        tags: tags,
        variations: variations,
        variants: variants.map((v) => ({
          ...v,
          additionalPrice: Number(v.additionalPrice) || 0,
        })),
        discountStart:
          restBasic.discountStart !== null && restBasic.discountStart !== ""
            ? Number(restBasic.discountStart)
            : null,
        discountEnd:
          restBasic.discountEnd !== null && restBasic.discountEnd !== ""
            ? Number(restBasic.discountEnd)
            : null,
        // MODIFIED: Only send maxDiscountPercentage
        maxDiscountPercentage:
          restBasic.maxDiscountPercentage !== null &&
          restBasic.maxDiscountPercentage !== ""
            ? Number(restBasic.maxDiscountPercentage)
            : null,
      };

      const res = await axios.post(
        "https://test.api.dpmsign.com/api/product/create-info-only",
        productDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const extractedProductId = res.data?.data?.data?.productId;

      if (
        typeof extractedProductId === "number" &&
        !isNaN(extractedProductId)
      ) {
        const newProductId = extractedProductId;
        setProductId(newProductId);
        sessionStorage.setItem("currentProductId", String(newProductId));

        Swal.fire(
          "Success!",
          res.data.message ||
            "Product information saved successfully. Now add images.",
          "success"
        );
        setCurrentStep(2);
      } else {
        console.error(
          "Backend response did not contain a valid productId in res.data.data.productId:",
          res.data
        );
        Swal.fire(
          "Error",
          "Failed to get product ID from server response. Please check server logs.",
          "error"
        );
      }
    } catch (err) {
      console.error(
        "Product info creation error:",
        err.response?.data?.message || err.message || err
      );
      Swal.fire(
        "Error",
        err.response?.data?.message ||
          "Failed to create product information. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUploadSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!productId) {
      Swal.fire(
        "Error",
        "Product ID is missing. Please go back to step 1 or start a new product.",
        "error"
      );
      setSubmitting(false);
      return;
    }

    if (newImages.length === 0) {
      Swal.fire("Validation", "Please select at least one image.", "warning");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      newImages.forEach((img) => {
        formData.append("product-images", img);
      });

      const imageRes = await axios.post(
        `https://test.api.dpmsign.com/api/product/${productId}/upload-images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.fire(
        "Success!",
        imageRes.data.message || "Images uploaded successfully!",
        "success"
      );

      sessionStorage.removeItem("currentProductId");
      setProductId(null);

      navigate("/products/all");
    } catch (err) {
      console.error(
        "Image upload error:",
        err.response?.data?.message || err.message || err
      );
      Swal.fire(
        "Error",
        err.response?.data?.message ||
          "Failed to upload images. Please try again.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsedAttributes = json
          .map((row) => ({
            property: row.Property,
            description: row.Description,
          }))
          .filter((attr) => attr.property && attr.description);

        setAttributes((prev) => [...prev, ...parsedAttributes]);
        Swal.fire("Success", "Attributes loaded from Excel!", "success");
      } catch (error) {
        console.error("Error processing Excel file:", error);
        Swal.fire(
          "Error",
          "Failed to process Excel file. Ensure it's a valid format with 'Property' and 'Description' columns.",
          "error"
        );
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white shadow-md rounded-md">
      <button
        onClick={() => {
          if (currentStep === 2) setCurrentStep(1);
          else {
            sessionStorage.removeItem("currentProductId");
            setProductId(null);
            navigate(-1);
          }
        }}
        className="btn btn-outline mb-6 px-4 py-2 hover:bg-gray-100 transition"
      >
        ← {currentStep === 2 ? "Back to Product Info" : "Back"}
      </button>
      <h1 className="text-4xl font-extrabold mb-8 text-gray-800">
        Add Product ({currentStep}/2)
        {productId && (
          <span className="text-sm text-gray-500 ml-2">(ID: {productId})</span>
        )}
      </h1>

      <div className="flex justify-center mb-8">
        <ul className="steps steps-horizontal">
          <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
            Product Information
          </li>
          <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
            Upload Images
          </li>
        </ul>
      </div>

      {currentStep === 1 && (
        <form onSubmit={handleProductInfoSubmit} className="space-y-10">
          <ProductBasicInfo
            basic={basic}
            handleBasicChange={handleBasicChange}
            categories={categories}
            subCategories={subCategories}
            allFetchedCategories={allFetchedCategories}
          />

          <ProductTags
            tags={tags}
            updateTag={updateTag}
            removeTag={removeTag}
            addTag={addTag}
          />

          <ProductAttributes
            attributes={attributes}
            updateAttr={updateAttr}
            removeAttr={removeAttr}
            addAttr={addAttr}
            handleExcelUpload={handleExcelUpload}
          />

          <ProductVariations
            variations={variations}
            updateVar={updateVar}
            removeVar={removeVar}
            addVar={addVar}
            addVarItem={addVarItem}
            updateVarItem={updateVarItem}
            removeVarItem={removeVarItem}
            handleCreateVariants={handleCreateVariants}
          />

          <ProductVariants
            variants={variants}
            updateVt={updateVt}
            removeVt={removeVt}
          />

          <button
            type="submit"
            disabled={submitting}
            className={`btn btn-primary w-full py-3 text-lg font-semibold transition ${
              submitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-primary-focus"
            }`}
          >
            {submitting ? "Saving Product Info..." : "Save Product Info & Next"}
          </button>
        </form>
      )}

      {currentStep === 2 && (
        <form onSubmit={handleImageUploadSubmit} className="space-y-10">
          <ProductImages
            newImages={newImages}
            uploadNewImages={uploadNewImages}
            removeNewImage={removeNewImage}
          />

          <button
            type="submit"
            disabled={submitting || newImages.length === 0}
            className={`btn btn-primary w-full py-3 text-lg font-semibold transition ${
              submitting || newImages.length === 0
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-primary-focus"
            }`}
          >
            {submitting ? "Uploading Images..." : "Upload Images & Finish"}
          </button>
        </form>
      )}
    </div>
  );
}
