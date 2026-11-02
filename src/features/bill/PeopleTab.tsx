import { useRef, useState } from 'react';
import { ScrollView, TextInput, type TextInputInstance } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Avatar';
import { MessageView } from '@/components/ui/States';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import type { Participant } from '@/domain/types';
import { MAX_PARTICIPANTS } from '@/domain/validation';
import { confirm } from '@/lib/dialogs';
import { haptics } from '@/lib/haptics';
import { useEditorStore } from '@/store/editorStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { row } from '@/theme/layout';

export function PeopleTab({ bottomInset }: { bottomInset: number }) {
  const participants = useEditorStore((s) => s.bill?.participants ?? []);
  const items = useEditorStore((s) => s.bill?.items ?? []);
  const { addParticipant, renameParticipant, removeParticipant } = useEditorStore.getState();
  const [name, setName] = useState('');
  const input = useRef<TextInputInstance>(null);
  const full = participants.length >= MAX_PARTICIPANTS;

  const add = () => {
    if (!name.trim() || full) return;
    addParticipant(name);
    haptics.tap();
    setName('');
    // Keep the keyboard up so a whole table can be typed in one go.
    input.current?.focus();
  };

  const remove = async (p: Participant) => {
    const used = items.filter((i) => (i.shares[p.id] ?? 0) > 0).length;
    if (used > 0) {
      const confirmed = await confirm({
        title: `Remove ${p.name}?`,
        message: `${p.name} is sharing ${used} ${used === 1 ? 'item' : 'items'}. They'll be unassigned from ${used === 1 ? 'it' : 'them'}.`,
        confirmLabel: 'Remove',
      });
      if (!confirmed) return;
    }
    haptics.warning();
    removeParticipant(p.id);
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingBottom: bottomInset, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      <TextField
        ref={input}
        accessibilityLabel="Add a person"
        placeholder={participants.length === 0 ? "Who's at the table?" : 'Add another person'}
        value={name}
        onChangeText={setName}
        onSubmitEditing={add}
        blurOnSubmit={false}
        returnKeyType="done"
        autoCapitalize="words"
        maxLength={40}
        editable={!full}
        right={
          <IconButton
            icon="plus"
            label="Add person"
            tone="accent"
            disabled={!name.trim() || full}
            onPress={add}
            style={{ marginRight: -12 }}
          />
        }
      />

      {participants.length === 0 ? (
        <MessageView
          mood="curious"
          title="Who's joining the feast?"
          message="Type a name above and press done. Add everyone who's sharing the bill."
        />
      ) : (
        participants.map((p) => (
          <Animated.View
            key={p.id}
            entering={FadeInDown.duration(250)}
            exiting={FadeOut.duration(150)}
            layout={LinearTransition}
          >
            <ParticipantRow
              participant={p}
              onRename={(n) => renameParticipant(p.id, n)}
              onRemove={() => remove(p)}
            />
          </Animated.View>
        ))
      )}
      {full ? (
        <Text variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
          Maximum of {MAX_PARTICIPANTS} people.
        </Text>
      ) : null}
    </ScrollView>
  );
}

function ParticipantRow({
  participant,
  onRename,
  onRemove,
}: {
  participant: Participant;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(participant.name);

  const commit = () => {
    if (draft.trim() && draft.trim() !== participant.name) onRename(draft);
    else setDraft(participant.name);
  };

  return (
    <Card style={{ ...row, gap: 12, paddingVertical: 8, paddingRight: 4 }}>
      <Avatar name={draft} colorIndex={participant.colorIndex} size={40} />
      <TextInput
        accessibilityLabel={`Name, ${participant.name}`}
        value={draft}
        onChangeText={setDraft}
        onEndEditing={commit}
        onSubmitEditing={commit}
        returnKeyType="done"
        maxLength={40}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        style={{ flex: 1, fontSize: 16, fontFamily: fonts.bold, color: colors.text, paddingVertical: 10 }}
      />
      <IconButton
        icon="trash"
        label={`Remove ${participant.name}`}
        tone="danger"
        size={20}
        onPress={onRemove}
      />
    </Card>
  );
}
