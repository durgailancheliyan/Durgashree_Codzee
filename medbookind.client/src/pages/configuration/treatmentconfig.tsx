import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Save, X } from "lucide-react";
import { useModal } from "@/contexts/ModalContext";
import { TxAddonsConfigDto, TxCategoryConfigDto, TxPlansConfigDto } from "@/interfaces";
import txConfigService from '@/services/txconfig.service';

interface treatmentconfig {
  practiceId?: string | null;
}

const TreatmentConfig: React.FC<treatmentconfig> = ({ practiceId }) => {
  // Treatments State
  const [treatments, setTreatments] = useState<TxPlansConfigDto[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Addons State
  const [addons, setAddons] = useState<TxAddonsConfigDto[]>([]);

  // Categories State
  const [categories, setCategories] = useState<TxCategoryConfigDto[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>("");

  // Form states for modals
  const [form, setForm] = useState<Partial<TxPlansConfigDto>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addonForm, setAddonForm] = useState<Partial<TxAddonsConfigDto>>({});
  const [addonEditingId, setAddonEditingId] = useState<string | null>(null);

  const { showModal, hideModal } = useModal();

  // Fetch all configs on mount or when practiceId changes
  useEffect(() => {
    if (!practiceId) return;
    txConfigService.getTxConfigs(practiceId).then((data) => {
      setTreatments(data.txPlans || []);
      setAddons(data.txAddons || []);
      setCategories(data.txCategory || []);
    });
  }, [practiceId]);

  // CATEGORY HANDLERS
  const handleAddCategory = async () => {
    if (newCategoryName.trim() && practiceId) {
      const newCat: TxCategoryConfigDto = { name: newCategoryName.trim(), practiceId };
      const created = await txConfigService.createCategory(newCat);
      setCategories((prev) => [...prev, created]);
      setNewCategoryName("");
    }
  };

  const handleRemoveCategory = async (cat: TxCategoryConfigDto) => {
    if (cat && cat.id) {
      await txConfigService.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setTreatments((prev) =>
        prev.map((t) => ({ ...t, categoryId: t.categoryId === cat.id ? "" : t.categoryId }))
      );
    }
  };

  // TREATMENT HANDLERS
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" && e.target instanceof HTMLInputElement ? e.target.checked : value,
    }));
  };

  const handleTreatmentAddonChange = (addonId: string, checked: boolean) => {
    setForm((prev) => {
      const prevAddons = Array.isArray((prev as any).addons) ? ((prev as any).addons as string[]) : [];
      return {
        ...prev,
        addons: checked
          ? [...prevAddons, addonId]
          : prevAddons.filter((id) => id !== addonId),
      };
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name || !form.fee || !form.duration || !form.categoryId || !practiceId) return;
    const payload: TxPlansConfigDto = {
      ...form,
      practiceId,
      fee: Number(form.fee),
      duration: Number(form.duration),
      active: form.active ?? true,
      categoryId: form.categoryId,
    } as TxPlansConfigDto;
    if (editingId) {
      payload.id = editingId;
      const updated = await txConfigService.updatePlan(payload);
      setTreatments((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
    } else {
      const created = await txConfigService.createPlan(payload);
      setTreatments((prev) => [...prev, created]);
    }
    hideModal();
    setForm({});
    setEditingId(null);
  };

  const handleEdit = (t: TxPlansConfigDto) => {
    setForm(t);
    setEditingId(t.id ?? null);
    openTreatmentModal(t);
  };

  const handleDelete = async (id: string) => {
    await txConfigService.deletePlan(id);
    setTreatments((prev) => prev.filter((t) => t.id !== id));
  };

  // ADDON HANDLERS
  const handleAddonFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setAddonForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" && e.target instanceof HTMLInputElement ? e.target.checked : value,
    }));
  };

  const handleAddonSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addonForm.name || addonForm.fee === undefined || !practiceId) return;
    const payload: TxAddonsConfigDto = {
      ...addonForm,
      practiceId,
      fee: Number(addonForm.fee),
      required: addonForm.required ?? false,
      multiple: addonForm.multiple ?? false,
    } as TxAddonsConfigDto;
    if (addonEditingId) {
      payload.id = addonEditingId;
      const updated = await txConfigService.updateAddon(payload);
      setAddons((prev) => prev.map((a) => (a.id === addonEditingId ? updated : a)));
    } else {
      const created = await txConfigService.createAddon(payload);
      setAddons((prev) => [...prev, created]);
    }
    hideModal();
    setAddonForm({});
    setAddonEditingId(null);
  };

  const handleAddonEdit = (addon: TxAddonsConfigDto) => {
    setAddonForm(addon);
    setAddonEditingId(addon.id ?? null);
    openAddonModal(addon);
  };

  const handleAddonRemove = async (id: string) => {
    await txConfigService.deleteAddon(id);
    setAddons((prev) => prev.filter((a) => a.id !== id));
    setTreatments((prev) =>
      prev.map((t) => {
        // Remove the addon from any treatment's addons array if present
        const tAddons = Array.isArray((t as any).addons) ? ((t as any).addons as string[]) : [];
        return {
          ...t,
          addons: tAddons.filter((aid) => aid !== id),
        };
      })
    );
  };

  // MODAL OPENERS
  const openAddonModal = (addon?: TxAddonsConfigDto) => {
    const initial = addon
      ? { ...addon }
      : { name: "", fee: 0, description: "", required: false, multiple: false };

    function AddonFormModal({ initialForm }: { initialForm: Partial<TxAddonsConfigDto> }) {
      const [localForm, setLocalForm] = useState<Partial<TxAddonsConfigDto>>(initialForm);

      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        const { name, value, type } = e.target;
        setLocalForm((prev) => ({
          ...prev,
          [name]: type === "checkbox" && e.target instanceof HTMLInputElement ? e.target.checked : value,
        }));
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localForm.name || localForm.fee === undefined || !practiceId) return;
        const payload: TxAddonsConfigDto = {
          ...localForm,
          practiceId,
          fee: Number(localForm.fee),
          required: localForm.required ?? false,
          multiple: localForm.multiple ?? false,
        } as TxAddonsConfigDto;
        if (addon && addon.id) {
          payload.id = addon.id;
          const updated = await txConfigService.updateAddon(payload);
          setAddons((prev) => prev.map((a) => (a.id === addon.id ? updated : a)));
        } else {
          const created = await txConfigService.createAddon(payload);
          setAddons((prev) => [...prev, created]);
        }
        hideModal();
      };

      return (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 h-full "
          style={{ minWidth: 350 }}
        >
          <h2 className="text-2xl font-bold text-blue-700 mb-6">
            {addon ? "Edit Add-on" : "Add Add-on"}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add-on Name</label>
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="name"
                placeholder="Add-on Name"
                value={localForm.name || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="fee"
                type="number"
                placeholder="Fee"
                value={localForm.fee ?? ""}
                onChange={handleChange}
                required
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="description"
                placeholder="Description"
                value={localForm.description || ""}
                onChange={handleChange}
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="required"
                  checked={localForm.required ?? false}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Required
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="multiple"
                  checked={localForm.multiple ?? false}
                  onChange={handleChange}
                  className="accent-blue-600"
                />
                Multiple
              </label>
            </div>
          </div>
          <div className="flex flex-row gap-2 mt-8">
            <button
              type="button"
              onClick={hideModal}
              className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow"
            >
              <Save className="w-5 h-5" />
              {addon ? "Update Add-on" : "Add Add-on"}
            </button>
          </div>
        </form>
      );
    }

    showModal(<AddonFormModal initialForm={initial} />);
  };

  const openTreatmentModal = (treatment?: TxPlansConfigDto) => {
    const initial = treatment
      ? { ...treatment }
      : {
          name: "",
          categoryId: categories.length > 0 ? categories[0].id ?? "" : "",
          description: "",
          fee: 0,
          duration: 0,
          active: true,
        };

    function TreatmentFormModal({ initialForm }: { initialForm: Partial<TxPlansConfigDto> }) {
      const [localForm, setLocalForm] = useState<Partial<TxPlansConfigDto>>(initialForm);

      const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
      ) => {
        const { name, value, type } = e.target;
        setLocalForm((prev) => ({
          ...prev,
          [name]: type === "checkbox" && e.target instanceof HTMLInputElement ? e.target.checked : value,
        }));
      };

      const handleAddonChange = (addonId: string, checked: boolean) => {
        setLocalForm((prev) => {
          const prevAddons = Array.isArray((prev as any).addons) ? ((prev as any).addons as string[]) : [];
          return {
            ...prev,
            addons: checked
              ? [...prevAddons, addonId]
              : prevAddons.filter((id) => id !== addonId),
          };
        });
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localForm.name || !localForm.fee || !localForm.duration || !localForm.categoryId || !practiceId) return;
        const payload: TxPlansConfigDto = {
          ...localForm,
          practiceId,
          fee: Number(localForm.fee),
          duration: Number(localForm.duration),
          active: localForm.active ?? true,
          categoryId: localForm.categoryId,
        } as TxPlansConfigDto;
        if (treatment && treatment.id) {
          payload.id = treatment.id;
          const updated = await txConfigService.updatePlan(payload);
          setTreatments((prev) => prev.map((t) => (t.id === treatment.id ? updated : t)));
        } else {
          const created = await txConfigService.createPlan(payload);
          setTreatments((prev) => [...prev, created]);
        }
        hideModal();
      };

      return (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 h-full pt-6"
          style={{ minWidth: 400 }}
        >
          <h2 className="text-2xl font-bold text-blue-700 mb-6">
            {treatment ? "Edit Treatment" : "Add Treatment"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Name</label>
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="name"
                placeholder="Treatment Name"
                value={localForm.name || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="categoryId"
                value={localForm.categoryId || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id || ""}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="fee"
                type="number"
                placeholder="Fee"
                value={localForm.fee ?? ""}
                onChange={handleChange}
                required
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="duration"
                type="number"
                placeholder="Duration"
                value={localForm.duration ?? ""}
                onChange={handleChange}
                required
                min={0}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                name="description"
                placeholder="Description"
                value={localForm.description || ""}
                onChange={handleChange}
                rows={2}
              />
            </div>
            {/*
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Add-ons</label>
              <div className="flex flex-wrap gap-4">
                {addons.map((addon) => (
                  <label key={addon.id} className="flex items-center gap-2 border rounded px-3 py-2 bg-gray-50 hover:bg-blue-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      name="addons"
                      value={addon.id ?? ""}
                      checked={Array.isArray((localForm as any).addons) && ((localForm as any).addons as string[]).includes(addon.id ?? "")}
                      onChange={e => handleAddonChange(addon.id ?? "", e.target.checked)}
                    />
                    <span>
                      {addon.name} <span className="text-gray-500">(${addon.fee})</span>
                      {addon.required && <span className="ml-2 text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Required</span>}
                      {addon.multiple && <span className="ml-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Multiple</span>}
                    </span>
                  </label>
                ))}
              </div>
              {Array.isArray((localForm as any).addons) && ((localForm as any).addons as string[]).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {((localForm as any).addons as string[]).map((aid) => {
                    const addon = addons.find(a => a.id === aid);
                    return addon ? (
                      <span
                        key={addon.id}
                        className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                      >
                        {addon.name} (${addon.fee})
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
            */}
          </div>
          <div className="flex flex-row gap-2 mt-8">
            <button
              type="button"
              onClick={hideModal}
              className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-semibold"
            >
              Close
            </button>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow"
            >
              {treatment ? "Update Treatment" : "Add Treatment"}
            </button>
          </div>
        </form>
      );
    }

    showModal(<TreatmentFormModal initialForm={initial} />);
  };

  return (
    <>
      {/* Practice Treatment Category Section */}
      <div className="max-w-12xl mx-auto pt-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-800 mb-2">Practice Treatment Categories</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <span
                  key={cat.id}
                  className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {cat.name}
                  <button
                    type="button"
                    className="ml-2 text-blue-500 hover:text-red-600"
                    onClick={() => handleRemoveCategory(cat)}
                    title="Remove category"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <input
                type="text"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Add new category"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
              />
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                onClick={handleAddCategory}
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-12xl mx-auto pt-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Treatments Section */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-blue-800 mb-2">Practice Treatment Types</h2>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                onClick={() => openTreatmentModal()}
              >
                <Plus className="w-5 h-5" /> Add Treatment
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                  <tr className="bg-blue-50 text-blue-900">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Fee</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((t) => (
                    <React.Fragment key={t.id}>
                      <tr className="border-b hover:bg-blue-50 transition">
                        <td className="p-3 font-semibold">{t.name}</td>
                        <td className="p-3">{categories.find(c => c.id === t.categoryId)?.name || ""}</td>
                        <td className="p-3">${t.fee}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${t.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                            {t.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 flex gap-2 items-center">
                          <button onClick={() => setExpanded(expanded === t.id ? null : t.id ?? null)} className="text-blue-600 hover:text-blue-800">
                            {expanded === t.id ? <ChevronUp /> : <ChevronDown />}
                          </button>
                          <button onClick={() => openTreatmentModal(t)} className="text-yellow-500 hover:text-yellow-700">
                            <Edit />
                          </button>
                          <button onClick={() => t.id && handleDelete(t.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 />
                          </button>
                        </td>
                      </tr>
                      {expanded === t.id && (
                        <tr>
                          <td colSpan={7} className="bg-blue-50 p-4">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="flex">
                                <div className="font-semibold text-gray-700 mb-1">Description :</div>
                                <div className="text-gray-800 ml-3">
                                  {t.description || <span className="text-gray-400">No description</span>}
                                </div>
                              </div>
                              {/*<div>
                                <div className="font-semibold text-gray-700 mb-1">Add-ons</div>
                                <ul className="ml-0 mt-1 space-y-1">
                                  {Array.isArray((t as any).addons) && ((t as any).addons as string[]).length === 0 && <li className="text-gray-400">No add-ons</li>}
                                  {Array.isArray((t as any).addons) && ((t as any).addons as string[]).map((aid) => {
                                    const addon = addons.find(a => a.id === aid);
                                    return addon ? (
                                      <li key={addon.id} className="flex items-center gap-2">
                                        <span>{addon.name} <span className="text-gray-500">(${addon.fee})</span></span>
                                        {addon.required && <span className="text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Required</span>}
                                        {addon.multiple && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">Multiple</span>}
                                      </li>
                                    ) : null;
                                  })}
                                </ul>
                              </div>*/}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-12xl mx-auto pt-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Addons Section */}
          <div className="w-full">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-800 mb-2">Practice Add-ons</h2>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                onClick={() => openAddonModal()}
              >
                <Plus className="w-4 h-4" /> Add Add-on
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg shadow">
                <thead>
                  <tr className="bg-blue-50 text-blue-900">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Fee</th>
                    <th className="p-3 text-left">Required</th>
                    <th className="p-3 text-left">Multiple</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {addons.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-gray-400 p-3 text-center">
                        No add-ons
                      </td>
                    </tr>
                  )}
                  {addons.map((addon) => (
                    <tr key={addon.id} className="border-b hover:bg-blue-50 transition">
                      <td className="p-3 font-semibold">{addon.name}</td>
                      <td className="p-3">${addon.fee}</td>
                      <td className="p-3">
                        {addon.required ? (
                          <span className="text-green-700 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="p-3">
                        {addon.multiple ? (
                          <span className="text-green-700 font-semibold">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                      <td className="p-3 text-xs text-gray-600">{addon.description}</td>
                      <td className="p-3 flex gap-2 items-center">
                        <button
                          type="button"
                          className="text-xs text-yellow-600 hover:underline flex items-center gap-1"
                          onClick={() => handleAddonEdit(addon)}
                        >
                          <Edit className="inline w-4 h-4" /> Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-500 hover:underline flex items-center gap-1"
                          onClick={() => addon.id && handleAddonRemove(addon.id)}
                        >
                          <Trash2 className="inline w-4 h-4" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TreatmentConfig;
