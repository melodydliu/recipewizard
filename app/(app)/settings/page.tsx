import { getMarkupSettings, useMock } from "@/lib/data";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const settings = await getMarkupSettings();

  const defaultValues = {
    flower_markup: settings.flower_markup,
    hard_good_markup: settings.hard_good_markup,
    lei_markup: settings.lei_markup,
    labor_markup: settings.labor_markup,
    delivery_markup: settings.delivery_markup,
    default_cleanup_fee: settings.default_cleanup_fee,
    default_tax_rate: settings.default_tax_rate,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage pricing defaults for your events.
        </p>
      </div>

      <SettingsForm defaultValues={defaultValues} isMock={useMock} />
    </div>
  );
}
