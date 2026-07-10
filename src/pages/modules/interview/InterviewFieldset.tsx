import { Link } from "react-router-dom";
import { useWatch } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CharCounter } from "@/components/ui/char-counter";
import { Info } from "lucide-react";
import {
  INTERVIEW_FIELD_MAX,
  type InterviewFormValues,
} from "@/lib/validation/interview-schema";

export type AffiliateEntry = { name?: string; url?: string; freebie?: string; ebook?: string };

function textareaHeightFor(max: number): string {
  if (max <= 300) return "min-h-[6rem]";
  if (max <= 800) return "min-h-[10rem]";
  if (max <= 1500) return "min-h-[16rem]";
  return "min-h-[20rem]";
}

function WatchedCounter({ control, name, max }: { control: any; name: string; max: number }) {
  const value = useWatch({ control, name });
  return <CharCounter current={typeof value === "string" ? value.length : 0} max={max} />;
}

function TextInput({
  name, label, required, form, placeholder, disabled,
}: {
  name: keyof InterviewFormValues;
  label: string;
  required?: boolean;
  form: any;
  placeholder?: string;
  disabled?: boolean;
}) {
  const max = INTERVIEW_FIELD_MAX[name];
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-primary">*</span>}
          </FormLabel>
          <FormControl>
            <Input placeholder={placeholder} maxLength={max} disabled={disabled} {...field} />
          </FormControl>
          <FormMessage />
          <WatchedCounter control={form.control} name={name} max={max} />
        </FormItem>
      )}
    />
  );
}

function TextAreaInput({
  name, label, required, form, placeholder, disabled,
}: {
  name: keyof InterviewFormValues;
  label: string;
  required?: boolean;
  form: any;
  placeholder?: string;
  disabled?: boolean;
}) {
  const max = INTERVIEW_FIELD_MAX[name];
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <span className="text-primary">*</span>}
          </FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              maxLength={max}
              className={textareaHeightFor(max)}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
          <WatchedCounter control={form.control} name={name} max={max} />
        </FormItem>
      )}
    />
  );
}

export function InterviewFieldset({
  form,
  affiliates,
  selectedAffiliateIndices,
  toggleAffiliate,
  disabled,
}: {
  form: any;
  affiliates: AffiliateEntry[];
  selectedAffiliateIndices: number[];
  toggleAffiliate: (idx: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Eckdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <TextInput
            name="interview_title"
            label="Interview-Titel"
            required
            form={form}
            placeholder="z. B. Bewusstsein und Transformation"
            disabled={disabled}
          />
          <TextAreaInput
            name="interview_topic"
            label="Thema des Interviews"
            form={form}
            placeholder="Worum geht es inhaltlich?"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Produkt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <TextAreaInput
            name="product"
            label="Produkt, über das gesprochen wird"
            form={form}
            disabled={disabled}
          />
          <TextInput
            name="product_market_since"
            label="Wie lange ist das Produkt bereits am Markt?"
            form={form}
            placeholder="z. B. seit 2 Jahren"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kontext & Risiken</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <TextAreaInput
            name="previous_interviews"
            label="Vorherige Interviews zu diesem Thema oder Produkt"
            form={form}
            placeholder="Links oder Titel auflisten"
            disabled={disabled}
          />
          <TextAreaInput
            name="critical_voices"
            label="Kritische Stimmen oder rechtliche Schwierigkeiten?"
            form={form}
            placeholder="Alles Relevante, das wir kennen sollten"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Affiliate-Produkte</CardTitle>
          <CardDescription>
            Wähle aus den im Profil hinterlegten Affiliate-Produkten aus, welche zu diesem Interview passen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {affiliates.filter((a) => a?.name || a?.url).length === 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                Keine Affiliate-Produkte im Speaker-Profil hinterlegt.{" "}
                <Link to="/module/erfassung" className="text-primary underline">
                  Im Profil ergänzen
                </Link>
                .
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {affiliates.map((aff, idx) => {
                if (!aff?.name && !aff?.url) return null;
                const checked = selectedAffiliateIndices.includes(idx);
                return (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 rounded-md border p-3 ${
                      disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-muted/40"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => !disabled && toggleAffiliate(idx)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{aff.name || "(ohne Name)"}</div>
                      {aff.url && (
                        <div className="truncate text-xs text-muted-foreground">{aff.url}</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
