import { useState, useEffect, useRef } from "react";
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
import { normalizeSchema } from "../utils/builder-state";

export const useFormData = () => {
  const { formId } = useParams<{ formId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [initialData, setInitialData] = useState<CustomForm | null>(null);
  const [profileSection, setProfileSection] = useState<FormSection>({
    section_name: "profile_data",
    fields: [],
  });
  const [selectedBasicFields, setSelectedBasicFields] = useState<string[]>([]);
  const [customFieldSections, setCustomFieldSections] = useState<FormSection[]>(
    [],
  );
  const [profileFieldRequiredOverrides, setProfileFieldRequiredOverrides] =
    useState<Record<string, boolean>>({});
  const schemaFingerprint = JSON.stringify([
    selectedBasicFields,
    customFieldSections,
    profileFieldRequiredOverrides,
  ]);
  const [savedSchema, setSavedSchema] = useState<string>();
  const [accessMode, setAccessMode] = useState<"public" | "members">("members");
  const loadVersion = useRef(0);

  const [activeTab, setActiveTab] = useState<string>(() => {
    return searchParams.get("tab") || "schema";
  });

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (activeTab !== "basic") {
      newSearchParams.set("tab", activeTab);
    } else {
      newSearchParams.delete("tab");
    }
    setSearchParams(newSearchParams, { replace: true });
  }, [activeTab, searchParams, setSearchParams]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleRequiredFieldChange = (fieldKey: string, required: boolean) => {
    setProfileFieldRequiredOverrides((prev) => ({
      ...prev,
      [fieldKey]: required,
    }));
  };

  const { loading: fetchLoading, run: fetchCustomForm } = useRequest(
    async () => {
      if (!formId) return;
      const version = ++loadVersion.current;
      const data = await getCustomForm(parseInt(formId));
      if (version !== loadVersion.current) return;
      if (data) {
        data.form_schema = normalizeSchema(data.form_schema);
        setInitialData(data);
        setAccessMode(data.form_schema.settings?.accessMode ?? "members");

        if (data.form_schema) {
          const profileSection = data.form_schema.fields.find(
            (section) => section.section_name === "profile_data",
          );
          const customSections = data.form_schema.fields.filter(
            (section) => section.section_name !== "profile_data",
          );

          if (profileSection) {
            setProfileSection(profileSection);
            const existingFields = profileSection.fields.map(
              (field) => field.key,
            );
            // Always include name and gender as default fields
            const defaultFields =
              data.feature_type === "independent_form"
                ? []
                : ["name", "gender"];
            const allFields = [
              ...new Set([...defaultFields, ...existingFields]),
            ];
            setSelectedBasicFields(allFields);

            // Extract required field overrides by comparing with defaults
            const requiredOverrides: Record<string, boolean> = {};
            profileSection.fields.forEach((field) => {
              const defaultField = BASIC_PROFILE_FIELDS.find(
                (f) => f.key === field.key,
              );
              if (defaultField && field.required !== defaultField.required) {
                requiredOverrides[field.key] = field.required;
              }
            });
            setProfileFieldRequiredOverrides(requiredOverrides);
            setSavedSchema(
              JSON.stringify([allFields, customSections, requiredOverrides]),
            );
          } else {
            const [emptyProfile] = normalizeSchema({
              fields: [{ section_name: "profile_data", fields: [] }],
            }).fields;
            if (emptyProfile) setProfileSection(emptyProfile);
            const defaults =
              data.feature_type === "independent_form"
                ? []
                : ["name", "gender"];
            setSelectedBasicFields(defaults);
            setProfileFieldRequiredOverrides({});
            setSavedSchema(JSON.stringify([defaults, customSections, {}]));
          }

          setCustomFieldSections(customSections);
        }
      }
    },
    {
      manual: true,
    },
  );

  const buildSchema = (): FormSchema => ({
    version: 2,
    ...(initialData?.feature_type === "independent_form"
      ? { settings: { accessMode } }
      : {}),
    fields: [
      {
        ...profileSection,
        navigation: undefined,
        fields: selectedBasicFields.flatMap((key) => {
          const field =
            profileSection.fields.find((item) => item.key === key) ??
            BASIC_PROFILE_FIELDS.find((item) => item.key === key);
          return field
            ? [
                {
                  ...field,
                  required:
                    initialData?.feature_type !== "independent_form" &&
                    ["name", "gender"].includes(key)
                      ? true
                      : (profileFieldRequiredOverrides[key] ?? field.required),
                },
              ]
            : [];
        }),
      },
      ...customFieldSections,
    ],
  });
  const restoreSchema = (schema: FormSchema): void => {
    setAccessMode(schema.settings?.accessMode ?? "members");
    const normalized = normalizeSchema(schema);
    const profile = normalized.fields.find(
      (section) => section.section_name === "profile_data",
    );
    if (profile) {
      setProfileSection(profile);
      setSelectedBasicFields(profile.fields.map((field) => field.key));
      setProfileFieldRequiredOverrides(
        Object.fromEntries(
          profile.fields.map((field) => [field.key, field.required]),
        ),
      );
    }
    setCustomFieldSections(
      normalized.fields.filter(
        (section) => section.section_name !== "profile_data",
      ),
    );
  };

  const { loading: updateLoading, runAsync: updateForm } = useRequest(
    async (values: {
      formName: string;
      formDescription: string;
      postSubmissionInfo: string;
      featureType?:
        | "activity_registration"
        | "club_registration"
        | "independent_form";
      featureId?: number | null;
    }) => {
      if (!formId) return;

      const saved = await updateCustomForm(parseInt(formId), {
        formName: values.formName,
        formDescription: values.formDescription || "",
        postSubmissionInfo: values.postSubmissionInfo || "",
        featureType: values.featureType,
        featureId: values.featureId,
        formSchema: buildSchema(),
      });

      setInitialData(saved);
      message.success("Formulir berhasil diperbarui!");
    },
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (formId) {
      fetchCustomForm();
    }
  }, [formId, fetchCustomForm]);

  return {
    accessMode,
    setAccessMode,
    setInitialData,
    initialData,
    buildSchema,
    restoreSchema,
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
    schemaDirty: savedSchema !== undefined && savedSchema !== schemaFingerprint,
    markSchemaSaved: () => setSavedSchema(schemaFingerprint),
  };
};
