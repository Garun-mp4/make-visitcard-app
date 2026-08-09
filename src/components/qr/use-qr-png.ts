import { useEffect, useRef, useState } from 'react'

import { createQrPngAsset, qrPngFileName, type QrPngAsset } from '@/lib/qr-code'

export function useQrPng(value: string, slug: string, active = true) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [asset, setAsset] = useState<QrPngAsset | null>(null)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    if (!active || !svgRef.current) return
    let current = true
    setAsset(null)
    setFailed(false)
    void createQrPngAsset(svgRef.current, qrPngFileName(slug)).then(
      (result) => {
        if (current) setAsset(result)
      },
      () => {
        if (current) setFailed(true)
      },
    )
    return () => {
      current = false
    }
  }, [active, revision, slug, value])

  return {
    svgRef,
    asset,
    failed,
    retry: () => setRevision((value) => value + 1),
  }
}
