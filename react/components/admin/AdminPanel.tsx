import React, { FC, Fragment, useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import {
  Alert,
  Layout,
  PageBlock,
  PageHeader,
  SelectableCard,
  Spinner,
  Toggle,
  Divider,
  Input,
  Button
} from 'vtex.styleguide'
import { useMutation, useQuery } from 'react-apollo'

import GET_APP_SETTINGS from '../../graphql/getAppSettings.gql'
import SAVE_APP_SETTINGS from '../../graphql/saveAppSettings.gql'
import { ADD, COMBINE, REPLACE } from '../../utils/constants'

const AdminPanel: FC = () => {
  const [settings, setSettings] = useState({} as AppSettings)
  const [categoriesIdsValue, setCategoriesIdsValue] = useState<string>();

  const { data, loading: loadingSettings, error: settingsError } = useQuery<{
    settings: AppSettings
  }>(GET_APP_SETTINGS, { ssr: false })

  const [saveSettings] = useMutation(SAVE_APP_SETTINGS)

  const handleUpdateSettings = ({
    type,
    value,
    saveChanges = true,
  }: {
    type: 'IS_AUTOMATIC' | 'STRATEGY' | 'CATEGORIES_IDS'
    value: boolean | Strategy | string
    saveChanges?: boolean
  }) => {
    switch (type) {
      case 'IS_AUTOMATIC':
        setSettings((prevSettings) => ({
          ...prevSettings,
          isAutomatic: value as boolean,
        }))
        break

      case 'STRATEGY':
        setSettings((prevSettings) => ({
          ...prevSettings,
          strategy: value as Strategy,
        }))
        break

      case 'CATEGORIES_IDS':
        setSettings((prevSettings) => ({
          ...prevSettings,
          categoriesIds: value as string,
        }))
        break

      default:
        console.error('Settings could not be updated')
        break
    }

    saveChanges && saveSettings({
      variables: {
        settings: {
          isAutomatic: type === 'IS_AUTOMATIC' ? value : settings.isAutomatic,
          strategy: type === 'STRATEGY' ? value : settings.strategy,
          categoriesIds: type === 'CATEGORIES_IDS' ? value : settings.categoriesIds
        },
      },
    })
  }

  useEffect(() => {
    if (!data?.settings) {
      return
    }

    const { isAutomatic, strategy, categoriesIds } = data.settings

    setSettings({ isAutomatic, strategy, categoriesIds })
    setCategoriesIdsValue(categoriesIds)
  }, [data?.settings])

  if (settingsError) {
    console.error(settingsError)
  }

  const { isAutomatic, strategy } = settings

  return (
    <Layout
      pageHeader={
        <PageHeader
          title={<FormattedMessage id="admin/cross-device-cart.title" />}
          subtitle={<FormattedMessage id="admin/cross-device-cart.subtitle" />}
        />
      }
    >
      <PageBlock>
        {settingsError ? (
          <Alert type="error">
            <FormattedMessage id="admin/cross-device-cart.error" />
          </Alert>
        ) : loadingSettings ? (
          <div className="flex justify-center mv5">
            <Spinner />
          </div>
        ) : (
          <Fragment>
            <Toggle
              label={
                isAutomatic ? (
                  <FormattedMessage id="admin/cross-device-cart.automatic-toggle-automatic" />
                ) : (
                  <FormattedMessage id="admin/cross-device-cart.automatic-toggle-manual" />
                )
              }
              semantic
              checked={isAutomatic}
              onChange={() =>
                handleUpdateSettings({
                  type: 'IS_AUTOMATIC',
                  value: !settings.isAutomatic,
                })
              }
              helpText={
                <FormattedMessage id="admin/cross-device-cart.automatic-toggle-help-text" />
              }
            />
            <p className="gray lh-copy">
              <FormattedMessage id="admin/cross-device-cart.automatic-toggle-explanation" />
            </p>

            <div className="pt6">
              <Divider />
            </div>
            <h3>Merge strategies</h3>
            <div className="flex justify-center">
              <div className="mr5 w-33">
                <SelectableCard
                  hasGroupRigth
                  hasGroupLeft
                  noPadding
                  selected={strategy === REPLACE}
                  onClick={() =>
                    handleUpdateSettings({ type: 'STRATEGY', value: REPLACE })
                  }
                >
                  <div className="pa7">
                    <div className="f5 tc">Replace</div>
                  </div>
                </SelectableCard>
              </div>
              <div className="mr5 w-34">
                <SelectableCard
                  hasGroupRigth
                  hasGroupLeft
                  noPadding
                  selected={strategy === ADD}
                  onClick={() =>
                    handleUpdateSettings({ type: 'STRATEGY', value: ADD })
                  }
                >
                  <div className="pa7">
                    <div className="f5 tc">Add</div>
                  </div>
                </SelectableCard>
              </div>
              <div className="w-33">
                <SelectableCard
                  hasGroupRigth
                  noPadding
                  selected={strategy === COMBINE}
                  onClick={() =>
                    handleUpdateSettings({ type: 'STRATEGY', value: COMBINE })
                  }
                >
                  <div className="pa7">
                    <div className="f5 tc">Combine</div>
                  </div>
                </SelectableCard>
              </div>
            </div>
            <p className="pt5 gray lh-copy">
              {strategy === REPLACE ? (
                <FormattedMessage id="admin/cross-device-cart.strategy-explanation.replace" />
              ) : strategy === COMBINE ? (
                <FormattedMessage id="admin/cross-device-cart.strategy-explanation.combine" />
              ) : (
                <FormattedMessage id="admin/cross-device-cart.strategy-explanation.add" />
              )}
            </p>
            <Divider />
            <h3>Id-uri de categorii excluse la recuperarea cosului</h3>
            <p>Aici introduceti id-urile categoriilor excluse la recuperarea cosului separate de virgula, (1234,5678, 9012)</p>
            <p>Acest camp a fost introdus pentru rezolvarea valorilor SGR duplicate, la recuperarea cosului de cumparaturi</p>
            <Input onChange={(e: any) => {
              setCategoriesIdsValue(e.target.value)
            }} value={categoriesIdsValue}></Input>
            <div className="pt5">
              <Button onClick={() => handleUpdateSettings({ type: "CATEGORIES_IDS", value: categoriesIdsValue as string, saveChanges: true })}>Salveaza</Button>
            </div>
          </Fragment>
        )}
      </PageBlock>
    </Layout>
  )
}

export { AdminPanel }
