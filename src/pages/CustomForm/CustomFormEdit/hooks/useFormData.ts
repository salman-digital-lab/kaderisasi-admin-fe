import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useRequest } from "ahooks";
import { message } from "antd";
import { useSearchParams } from "react-router-dom";

import {
  getCustomForm,
  updateCustomForm,
} from "../../../../api/services/customForm";
import type {
  CustomForm,
  FormSchema,
  FormSection,
} from "../../../../types/model/customForm";
import { BASIC_PROFILE_FIELDS } from "../constants";

export const useFormData = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [initialData, setInitialData] = useState<CustomForm | null>(null);
  const [selectedBasicFields, setSelectedBasicFields] = useState<string[]>([]);
  const [customFieldSections, setCustomFieldSections] = useState<FormSection[]>([]);
  const [profileFieldRequiredOverrides, setProfileFieldRequiredOverrides] = useState<Record<string, boolean>>({});

  // Active tab state with URL sync
  const [activeTab, setActiveTab] = useState<string>(() => {
    return searchParams.get("tab") || "basic";
  });

  // Sync URL with active tab
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTab !== "basic") {
      newSearchParams.set("tab", activeTab);
    } else {
      newSearchParams.delete("tab");
    }
    setSearchParams(newSearchParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // Handle required field changes
  const handleRequiredFieldChange = (fieldKey: string, required: boolean) => {
    setProfileFieldRequiredOverrides(prev => ({
      ...prev,
      [fieldKey]: required
    }));
  };

  const { loading: fetchLoading, run: fetchCustomForm } = useRequest(
    async () => {
      if (!id) return;
      const data = await getCustomForm(parseInt(id));
      if (data) {
        setInitialData(data);

        // Initialize form schema data
        if (data.form_schema) {
          // Extract basic fields and custom field sections from existing schema
          const profileSection = data.form_schema.fields.find(
            (section) => section.section_name === "profile_data",
          );
          const customSections = data.form_schema.fields.filter(
            (section) => section.section_name !== "profile_data",
          );

          if (profileSection) {
            const existingFields = profileSection.fields.map((field) => field.key);
            // Always include name and gender as default fields
            const defaultFields = ["name", "gender"];
            const allFields = [...new Set([...defaultFields, ...existingFields])];
            setSelectedBasicFields(allFields);
          } else {
            // If no existing profile section, set default fields
            setSelectedBasicFields(["name", "gender"]);
          }

          // Load custom sections (excluding profile_data)
          setCustomFieldSections(customSections);
        }
      }
    },
    {
      manual: true,
    },
  );

  const { loading: updateLoading, run: updateForm } = useRequest(
    async (values: { 
      formName: string; 
      formDescription: string;
      postSubmissionInfo: string;
      featureType?: "activity_registration" | "club_registration" | "independent_form";
      featureId?: number | null;
    }) => {
      if (!id) return;

      // Build form schema from current state
      const profileFields = BASIC_PROFILE_FIELDS
        .filter((field) => selectedBasicFields.includes(field.key))
        .map((field) => ({
          ...field,
          required: profileFieldRequiredOverrides[field.key] ?? field.required
        }));

      const updatedFormSchema: FormSchema = {
        fields: [
          {
            section_name: "profile_data",
            fields: profileFields,
          },
          ...customFieldSections,
        ],
      };

      await updateCustomForm(parseInt(id), {
        formName: values.formName,
        formDescription: values.formDescription,
        postSubmissionInfo: values.postSubmissionInfo,
        featureType: values.featureType,
        featureId: values.featureId,
        formSchema: updatedFormSchema,
      });
      message.success("Formulir berhasil diperbarui!");
    },
    {
      manual: true,
      onError: () => {
        message.error("Gagal memperbarui formulir");
      },
    },
  );

  useEffect(() => {
    if (id) {
      fetchCustomForm();
    }
  }, [id]);

  return {
    initialData,
    selectedBasicFields,
    setSelectedBasicFields,
    customFieldSections,
    setCustomFieldSections,
    profileFieldRequiredOverrides,
    activeTab,
    handleTabChange,
    handleRequiredFieldChange,
    fetchLoading,
    updateLoading,
    updateForm,
  };
};
